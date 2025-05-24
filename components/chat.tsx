'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface ChatProps {
  id: string;
  initialMessages: Message[];
}

// Typing animation component
function TypingMessage({ content }: { content: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    setDisplayedText(''); // Reset when content changes
    setAnimationFinished(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) {
        clearInterval(interval);
        setAnimationFinished(true); // Indicate animation is complete
      }
    }, 15); // typing speed

    return () => clearInterval(interval);
  }, [content]);

  // If animation is finished, render the full content directly for better copy-paste UX
  return <span>{animationFinished ? content : displayedText}</span>;
}

export function Chat({ id, initialMessages }: ChatProps) {
  // 🔥 Initial state for recalibration should likely be true if you want the full prompt on first message
  const [needsRecalibration, setNeedsRecalibration] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(id);
  const [currentChatTitle, setCurrentChatTitle] = useState('Untitled Chat'); // This should ideally come from props or be dynamically set

  // This function detects AI persona drift from the assistant's completed response
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
    ];
    const lower = aiResponse.toLowerCase();
    return genericTriggers.some(trigger => lower.includes(trigger));
  }

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit, // Use the built-in handleSubmit from useChat
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    initialMessages,
    id: currentChatId, // Pass chat ID to useChat for potential API endpoint use
    body: {
      previewToken: null, // If you're not using a preview token, keep it null
      needsRecalibration: needsRecalibration, // Send the flag with the current request
      userId: 'user-id-placeholder', // Replace with actual user ID logic
      title: currentChatTitle, // Send chat title
    },
    onResponse: (response) => {
      // This fires when the first chunk of data is received, you can set recalibration for *next* turn
      // based on the response headers or initial content if needed, but onFinish is more reliable
    },
    onFinish: (message) => {
      // This fires when the entire assistant message is received and processed
      const recalibrationNeeded = detectAiPersonaDrift(message.content);
      // console.log(`Client detected needsRecalibration for next turn: ${recalibrationNeeded}`);
      setNeedsRecalibration(recalibrationNeeded); // Update for the *next* turn
    },
    onError: (err) => {
      console.error('Chat error:', err);
      // You could append an error message to the chat here if desired
      // append({ id: nanoid(), role: 'assistant', content: `Error: ${err.message}` });
    }
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && (
        <div className="rounded-md bg-red-500 p-4 text-white">
          Error: {error.message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4">
        {messages.length > 0 ? (
          messages.map((m: Message) => (
            <div key={m.id} className="whitespace-pre-wrap mb-2">
              <strong>{m.role === 'user' ? 'You: ' : 'HER: '}</strong>
              {m.role === 'assistant' ? (
                // Only use TypingMessage for the *last* assistant message that is still loading
                isLoading && messages[messages.length - 1].id === m.id ? (
                  <TypingMessage content={m.content} />
                ) : (
                  <span>{m.content}</span>
                )
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">Start chatting with HER...</div>
        )}
      </div>

      <form onSubmit={handleSubmit}> {/* Use useChat's handleSubmit */}
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder={isLoading ? 'HER is thinking...' : 'Say something...'}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" className="hidden">Send</button>
      </form>
    </div>
  );
}