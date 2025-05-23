'use client'

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';

export default function Chat() {
  const [needsRecalibration, setNeedsRecalibration] = useState(false);

  // You might need to modify the useChat hook's `messages` parameter
  // to include custom data like `needsRecalibration`.
  // The 'ai' package's useChat often doesn't directly support custom request bodies
  // in a straightforward way for the `messages` array itself without overriding the `send` function.

  // A more robust way to pass this custom data is to extend the `useChat` hook's `send` function
  // or use a custom fetcher. For a direct copy-paste that works with typical `useChat`:
  // We'll pass it in the `body` of the POST request if you're directly using `Workspace`.

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    // How to pass `needsRecalibration` with `useChat`'s default `handleSubmit`?
    // This is the tricky part. `useChat`'s `body` option is for initial request.
    // For subsequent requests, you'd typically manipulate `messages` or `data` properties.

    // The most direct way is to extend `useChat` or create a custom `doChat` function.
    // Let's assume you'll modify the `handleSubmit` to include `needsRecalibration`
    // when sending the request.

    // onFinish is called when the stream completes
    onFinish: (message) => {
      // Assuming 'message' here is the assistant's final response
      // You can re-run your `detectAiPersonaDrift` function on the client if needed
      // OR, ideally, the server communicates this back explicitly.
      // For this example, let's assume the server *could* include it in a header,
      // but `StreamingTextResponse` makes that hard.
      // A more robust solution involves a custom fetcher with `useChat` or
      // fetching directly.

      // For a simplified conceptual client-side update:
      // In a real application, the server would send a flag back.
      // If the server cannot directly send it via stream, you might need to:
      // 1. Have the client analyze the *assistant's response* for drift (duplicate logic).
      // 2. Send a separate API call to update the flag after `onFinish`.

      // For demonstration, let's modify the `handleSubmit` slightly below.
    },
    onError: (error) => {
      console.error("Chat error:", error);
      // Handle error gracefully
    },
  });

  // Custom handleSubmit to include needsRecalibration
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // The `useChat` hook directly sends `messages` and `input`.
    // We need to inject `needsRecalibration` into the body.
    // A common way is to make a direct `Workspace` call and then use `append` or `setMessages`
    // from the `useChat` hook.

    // Get current messages from useChat hook
    const currentMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const newUserMessage = { role: 'user', content: input };
    const allMessagesToSend = [...currentMessages, newUserMessage];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessagesToSend,
          needsRecalibration: needsRecalibration, // Send the current flag
          // Other data like json.id, json.userId, json.title would also be sent here
          // This requires you to manage `id`, `userId`, `title` in client state too.
          id: 'chat-id-from-state', // Replace with actual chat ID from your state
          userId: 'user-id-from-auth', // Replace with actual user ID from your auth
          title: 'chat-title-from-state', // Replace with actual chat title from your state
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      // Read the streamed response
      const data = response.body;
      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = '';

      // Clear input immediately after sending
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);

      // Add the new user message to local state immediately
      append(newUserMessage); // Or setMessages with the new user message

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        assistantResponse += chunk;
        // Update messages state to show streaming
        // This is simplified, useChat handles streaming updates internally,
        // but for a manual fetch, you'd typically append token by token.
        // For now, let's just use `append` for the final message.
        // If you need real-time streaming updates with manual fetch, it's more complex.
      }

      // Add the full assistant response to the chat messages after it's complete
      append({ role: 'assistant', content: assistantResponse });

      // After getting the full assistant response, detect if *it* needs recalibration
      // and update the state for the *next* request.
      // This is duplicating logic from the server, but needed if server can't push back a flag.
      const aiNeedsRecalibrationAfterThisTurn = detectAiPersonaDrift(assistantResponse);
      setNeedsRecalibration(aiNeedsRecalibrationAfterThisTurn);
      console.log('Client-side calculated needsRecalibration for next turn:', aiNeedsRecalibrationAfterThisTurn);


    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error in UI
    }
  };


  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          <strong>{m.role === 'user' ? 'You: ' : 'HER: '}</strong>
          {m.content}
        </div>
      ))}

      <form onSubmit={customHandleSubmit}> {/* Use custom handleSubmit */}
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          disabled={isLoading} // Disable input while AI is thinking
        />
        <button type="submit" className="hidden">Send</button>
      </form>
    </div>
  );
}

// You might need to move this helper to a shared utility or duplicate if strict server-only rules apply
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
