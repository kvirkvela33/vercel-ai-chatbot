// components/chat-message.tsx
import React from 'react';

type ChatMessageProps = {
  sender: 'user' | 'assistant';
  text: string;
};

export default function ChatMessage({ sender, text }: ChatMessageProps) {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          relative px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed 
          max-w-[75%] sm:max-w-[65%] md:max-w-[55%] 
          ${isUser ? 'bg-surfaceUser text-white rounded-lg rounded-br-none' : 'bg-surface text-white rounded-lg rounded-bl-none'}
          shadow-sm
        `}
      >
        {text}
        <div
          className={`
            absolute bottom-0 h-px left-0 right-0 
            ${isUser ? 'bg-blue-800' : 'bg-gray-700'}
          `}
        />
      </div>
    </div>
  );
}