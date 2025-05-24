// components/chat-list.tsx

import React from 'react';
import { Separator } from '@/components/ui/separator';
import ChatMessage from '@/components/chat-message'; // ✅ FIXED

export interface Message {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
}

export interface ChatListProps {
  messages: Message[];
}

export const ChatList: React.FC<ChatListProps> = ({ messages }) => {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col space-y-2 p-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-400">No messages yet</div>
      ) : (
        messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            sender={msg.sender}
            text={msg.text}
          />
        ))
      )}
      <div ref={bottomRef} />
      <Separator />
    </div>
  );
};