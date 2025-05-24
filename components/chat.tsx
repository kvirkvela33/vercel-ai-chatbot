'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
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
    }, 15); // typing speed (adjust as needed, 15ms is quite fast)

    return () => clearInterval(interval);
  }, [content]);

  return <span>{animationFinished ? content : displayedText}</span>;
}

export function Chat({ id, initialMessages }: ChatProps) {
  const [needsRecalibration, setNeedsRecalibration] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(id);
  const [currentChatTitle, setCurrentChatTitle] = useState('Untitled Chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea

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
      userId: 'user-id-placeholder', // Replace with actual user ID logic
      title: currentChatTitle, // Send chat title
    },
    onFinish: (message) => {
      const recalibrationNeeded = detectAiPersonaDrift(message.content);
      // console.log(`Client detected needsRecalibration for next turn: ${recalibrationNeeded}`);
      setNeedsRecalibration(recalibrationNeeded); // Update for the *next* turn
      // Auto-focus the input after a response is received
      textAreaRef.current?.focus();
    },
    onError: (err) => {
      console.error('Chat error:', err);
      // Auto-focus the input even on error
      textAreaRef.current?.focus();
    }
  });

  // Auto-scroll to the bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]); // Trigger scroll on new messages or when loading state changes

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'; // Reset height
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [input]); // Recalculate height when input changes

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter, but not on Shift+Enter
      e.preventDefault(); // Prevent new line
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>); // Cast to FormEvent for handleSubmit
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-xl mx-auto bg-gray-900 text-gray-100">
      {/* Header (optional, for chat title or info) */}
      <div className="flex-none p-4 bg-gray-800 border-b border-gray-700 text-lg font-semibold text-center">
        Chat with HER
      </div>

      {/* Main chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-8 pb-8"> {/* Added vertical padding */}
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
              {/* HER's Avatar/Icon */}
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 size-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                  H
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[70%] p-3 rounded-2xl shadow-md whitespace-pre-wrap leading-relaxed ${
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

              {/* User's Avatar/Icon */}
              {m.role === 'user' && (
                <div className="flex-shrink-0 size-8 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold ml-2">
                  You
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-20">
            Start chatting with HER... she&apos;s waiting.
          </div>
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Fixed at bottom */}
      <form onSubmit={handleSubmit} className="flex-none p-4 bg-gray-800 border-t border-gray-700 sticky bottom-0 w-full">
        <div className="flex items-end space-x-2 bg-gray-800 p-2 rounded-xl border border-gray-600 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <textarea
            ref={textAreaRef}
            rows={1} // Start with one row
            className="flex-1 resize-none overflow-hidden bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none p-1" // No border here, border on parent div
            value={input}
            placeholder={isLoading ? 'HER is thinking...' : 'Message HER...'}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown} // Handle Enter key
            disabled={isLoading}
            autoFocus // Auto-focus the input field on load
          />
          <button
            type="submit"
            className="flex-shrink-0 p-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}