'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect, useRef } from 'react'; // Import useRef for auto-scroll
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
  const [needsRecalibration, setNeedsRecalibration] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(id);
  const [currentChatTitle, setCurrentChatTitle] = useState('Untitled Chat'); // This should ideally come from props or be dynamically set

  // Ref for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    initialMessages,
    id: currentChatId,
    body: {
      previewToken: null,
      needsRecalibration: needsRecalibration,
      userId: 'user-id-placeholder',
      title: currentChatTitle,
    },
    onFinish: (message) => {
      const recalibrationNeeded = detectAiPersonaDrift(message.content);
      setNeedsRecalibration(recalibrationNeeded);
    },
    onError: (err) => {
      console.error('Chat error:', err);
    }
  });

  // Auto-scroll to the bottom when messages change or HER is typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]); // Trigger scroll on new messages or when loading state changes

  return (
    <div className="flex flex-col h-screen w-full max-w-xl mx-auto bg-gray-900 text-gray-100">
      {/* Header (optional, for chat title or info) */}
      <div className="flex-none p-4 bg-gray-800 border-b border-gray-700 text-lg font-semibold text-center">
        Chat with HER
      </div>

      {/* Main chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-md bg-red-600 p-4 text-white text-center">
            Error: {error.message}
          </div>
        )}

        {messages.length > 0 ? (
          messages.map((m: Message) => (
            <div
              key={m.id}
              className={`flex items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* HER's Avatar/Icon (optional) */}
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                  H
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[70%] p-3 rounded-xl shadow-md whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {m.role === 'assistant' && isLoading && messages[messages.length - 1].id === m.id ? (
                  <TypingMessage content={m.content} />
                ) : (
                  <span>{m.content}</span>
                )}
              </div>

              {/* User's Avatar/Icon (optional) */}
              {m.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold ml-2">
                  You
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-20">
            Start chatting with HER... she's waiting.
          </div>
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex-none p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            className="flex-1 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500"
            value={input}
            placeholder={isLoading ? 'HER is thinking...' : 'Say something...'}
            onChange={handleInputChange}
            disabled={isLoading}
            autoFocus // Auto-focus the input field on load
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
            disabled={isLoading || !input.trim()} // Disable send button if loading or input is empty
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}