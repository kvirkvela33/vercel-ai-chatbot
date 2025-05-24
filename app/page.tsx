'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const GPTMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}>
      <div
        className={`max-w-[680px] px-4 py-3 text-sm leading-relaxed shadow-md rounded-lg whitespace-pre-wrap font-sans ${
          isUser ? 'bg-surfaceUser text-white' : 'bg-surface text-white'
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
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input.trim() };
    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        }),
      });

      const data = await res.json();
      const aiMessage: Message = {
        sender: 'ai',
        text: data.content || '⚠️ No response from AI.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Backend error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: '⚠️ Failed to connect to AI backend.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-white font-sans">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-6 pb-32">
        {messages.map((msg, idx) => (
          <GPTMessage key={idx} message={msg} />
        ))}
        {loading && (
          <div className="px-4 py-1 flex justify-start">
            <div className="bg-surface text-white px-4 py-3 rounded-lg text-sm animate-pulse">
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-input px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message HER.ai..."
            className="w-full bg-input text-white placeholder:text-muted-foreground rounded-md px-4 py-3 resize-none focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-accent hover:bg-accent-foreground text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}