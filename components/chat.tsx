'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect } from 'react';

// IMPORTANT: Tune these 'genericTriggers' very carefully to match HER's persona
// This function needs to be duplicated on the client to check the AI's own response
function detectAiPersonaDrift(aiResponse: string): boolean {
  const genericTriggers = [
    'as an ai language model',
    'i am an ai',
    'how can i assist you today',
    'is there anything else i can help with',
    'feel free to ask',
    'let me know if you have any other questions',
    'i cannot express emotions',
    'as a large language model',
    'i do not have personal experiences',
    'i am here to help',
    'i understand your feelings',
    // Add more phrases that HER would definitively NOT say
  ];
  const lowerCaseResponse = aiResponse.toLowerCase();
  return genericTriggers.some(trigger => lowerCaseResponse.includes(trigger));
}

// Dummy data for chat info - REPLACE WITH YOUR ACTUAL STATE/PROPS
const CHAT_ID = 'your-chat-id-here'; // e.g., from a URL param, or generated on new chat
const USER_ID = 'your-user-id-here'; // e.g., from Supabase auth
const CHAT_TITLE = 'Your Chat Title'; // e.g., first message, or default

export default function Chat() {
  // State to track if HER's previous response indicated drift
  const [needsRecalibration, setNeedsRecalibration] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(CHAT_ID); // Manage chat ID state
  const [currentChatTitle, setCurrentChatTitle] = useState(CHAT_TITLE); // Manage chat title state

  const { messages, input, handleInputChange, append, isLoading, error } = useChat({
    api: '/api/chat',
    // We will override handleSubmit, so no need to pass data here directly for body
    // onFinish will not be used in this custom fetch scenario as we manage streaming
  });

  // Custom handleSubmit to include needsRecalibration flag and handle streaming manually
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !isLoading) return; // Prevent sending empty messages

    // Create the new user message object
    const newUserMessage: Message = { role: 'user', content: input };

    // Append the user's message immediately to the UI
    append(newUserMessage);

    // Prepare all messages to send to the API (including the new user message)
    // Filter out potential old system messages if useChat adds them internally,
    // though the server also filters them.
    const messagesForApi = messages.map(m => ({ role: m.role, content: m.content }));
    const allMessagesToSend = [...messagesForApi, newUserMessage];

    // Clear input field immediately
    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);

    try {
      // Send the request to your API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessagesToSend,
          previewToken: null, // If you have a preview token feature
          needsRecalibration: needsRecalibration, // Send the current flag to the server
          id: currentChatId, // Pass the chat ID
          userId: USER_ID, // Pass the user ID
          title: currentChatTitle, // Pass the chat title
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Network response was not ok.');
      }

      const data = response.body;
      if (!data) {
        throw new Error('No data in response body.');
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponseAccumulated = ''; // Accumulate AI's full response

      // Manually stream the AI's response to the UI
      // Use a new message ID or update the last assistant message
      // Note: useChat's `append` will create a new message.
      // If you want true live-streaming token by token into one message,
      // you'd need more intricate state management or use useChat's internal
      // streaming helpers if available for custom fetch.
      // For simplicity here, we append final response for now.

      // For token-by-token streaming with append, you'd typically have an assistant message ID
      // and keep updating its content. For now, this just adds the final response.

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        assistantResponseAccumulated += chunk;
        // Optionally, update UI here for live streaming:
        // You could update a ref or a state variable that represents the partial assistant message
      }

      // After streaming completes, add the full assistant response to the UI
      append({ role: 'assistant', content: assistantResponseAccumulated });

      // After receiving the full assistant response, detect if *it* was generic
      // and update the `needsRecalibration` state for the *next* request.
      const aiNeedsRecalibrationAfterThisTurn = detectAiPersonaDrift(assistantResponseAccumulated);
      setNeedsRecalibration(aiNeedsRecalibrationAfterThisTurn);
      console.log('Client-side calculated needsRecalibration for next turn:', aiNeedsRecalibrationAfterThisTurn);

      // If it's the first message and you want to generate a title
      if (messages.length === 0 && !currentChatTitle) { // Check if title is default placeholder
        // You might send another API call here to get a title
        // or generate it on the client based on the first few turns.
        // For now, it just uses the default placeholder.
      }


    } catch (e: any) {
      console.error('Failed to send message:', e);
      // You might want to append an error message to the chat or show a toast
      append({ role: 'assistant', content: `Error: ${e.message}` });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && (
        <div className="rounded-md bg-red-500 p-4">
          <p className="text-sm font-medium text-white">{error.message}</p>
        </div>
      )}

      {messages.length > 0 ? (
        messages.map((m: Message) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <strong>{m.role === 'user' ? 'You: ' : 'HER: '}</strong>
            {m.content}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">
          Start a conversation with HER!
        </div>
      )}

      <form onSubmit={customHandleSubmit}> {/* Use custom handleSubmit */}
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder={isLoading ? "HER is thinking..." : "Say something..."}
          onChange={handleInputChange}
          disabled={isLoading} // Disable input while AI is thinking
        />
        <button type="submit" className="hidden">Send</button>
      </form>
    </div>
  );
}
