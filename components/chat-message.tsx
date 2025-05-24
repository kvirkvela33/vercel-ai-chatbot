// components/chat-message.tsx

import React from 'react';

interface ChatMessageProps {
  sender: 'user' | 'assistant';
  text: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => {
  return (
    <div
      className={`my-2 flex ${
        sender === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-xs rounded-lg px-4 py-2 shadow ${
          sender === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-300 text-black'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;