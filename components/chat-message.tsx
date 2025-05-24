'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/chat-message';

type Message = {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'assistant', text: 'Hey, I’m here. Wanna talk?' },
    { id: 2, sender: 'user', text: 'I’m not even sure why I opened this...' },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          ...messages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
          { role: 'user', content: input },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      console.error('HER backend failed');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let aiText = '';
    const assistantId = messages.length + 2;

    setMessages((prev) => [...prev, { id: assistantId, sender: 'assistant', text: '' }]);

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value || new Uint8Array(), { stream: true });
      aiText += chunkValue;

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text: aiText } : m))
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1.5 md:space-y-2">
        {messages.map((msg) =>
          msg.sender === 'assistant' && msg.text === '' ? (
            <div key={msg.id} className="text-sm italic text-gray-500 pl-2">typing...</div>
          ) : (
            <ChatMessage key={msg.id} sender={msg.sender} text={msg.text} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-gray-800 p-4 sm:p-6 border-t border-gray-700 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message HER.ai..."
          className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="ml-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}