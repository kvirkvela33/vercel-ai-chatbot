'use client';

import { useEffect, useRef } from 'react';
import { useChat, Message } from 'ai/react';
import { nanoid } from 'nanoid';

function TypingMessage({ content }: { content: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!spanRef.current) return;
    let i = 0;
    const interval = setInterval(() => {
      if (spanRef.current) {
        spanRef.current.textContent = content.slice(0, i + 1);
      }
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [content]);

  return <span ref={spanRef}></span>;
}

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-40">
      {/* Chat messages */}
      <div className="space-y-4 mt-10">
        {messages.map((m: Message) => (
          <div key={m.id} className="whitespace-pre-wrap text-sm leading-relaxed">
            <span className="font-semibold">
              {m.role === 'user' ? 'You' : 'HER'}
              {': '}
            </span>
            {m.role === 'assistant' ? (
              <TypingMessage content={m.content} />
            ) : (
              <span>{m.content}</span>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-400 italic text-sm">HER is typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <form onSubmit={handleSubmit} className="mt-6">
        <input
          className="w-full border border-gray-700 bg-background text-white rounded-lg p-3 shadow-lg focus:outline-none"
          value={input}
          onChange={handleInputChange}
          placeholder={isLoading ? 'HER is thinking...' : 'Say something...'}
          disabled={isLoading}
        />
      </form>

      {error && (
        <div className="text-red-500 text-sm mt-4">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}