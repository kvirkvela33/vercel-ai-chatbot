// ✅ Gemini-style HER Chat UI with typing animation, layout, and no glitch
'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';

interface ChatProps {
  id: string;
  initialMessages: Message[];
}

function TypingMessage({ content }: { content: string }) {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [content]);
  return <span className="whitespace-pre-wrap text-sm leading-relaxed">{displayedText}</span>;
}

export function Chat({ id, initialMessages }: ChatProps) {
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
    id,
    body: { previewToken: null },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-2xl mx-auto bg-black text-white">
      {/* Chat Messages */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-4">
        {messages.map((m: Message, index) => (
          <div key={m.id || index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap text-sm shadow-md transition-all duration-200 ease-out animate-fade-in ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-neutral-800 text-white rounded-bl-none'
            }`}>
              {m.role === 'assistant' && index === messages.length - 1 && isLoading ? (
                <TypingMessage content={m.content} />
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-neutral-700 bg-black">
        <div className="flex items-end bg-neutral-900 border border-neutral-700 rounded-xl p-2">
          <textarea
            ref={textAreaRef}
            rows={1}
            className="flex-1 resize-none overflow-hidden bg-transparent text-white placeholder-neutral-400 focus:outline-none px-2"
            value={input}
            placeholder={isLoading ? 'HER is typing...' : 'Say something...'}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-40"
            disabled={isLoading || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        {error && <div className="text-red-500 text-xs mt-2">{error.message}</div>}
      </form>
    </div>
  );
}