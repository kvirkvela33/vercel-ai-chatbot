'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const GPTMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-2 px-2`}>
      <div
        className={`max-w-3xl px-4 py-3 rounded-lg shadow-sm text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#2f81f7] text-white'
            : 'bg-[#444654] text-white'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: trimmed }] }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        sender: 'ai',
        text: data.content || 'No response from AI.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('❌ Backend Error:', err);
      setMessages((prev) => [...prev, { sender: 'ai', text: '⚠️ Failed to connect to AI backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#343541] text-white font-sans">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((msg, idx) => (
          <GPTMessage key={idx} message={msg} />
        ))}
        {loading && (
          <div className="w-full flex justify-start my-2 px-2">
            <div className="bg-[#444654] px-4 py-3 rounded-lg text-sm animate-pulse">Typing...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="w-full bg-[#343541] px-4 py-4 border-t border-[#4b4b4e]">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            className="w-full bg-[#40414f] text-white placeholder-gray-400 rounded-md px-4 py-3 resize-none focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-[#2f81f7] hover:bg-[#1a73e8] text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}