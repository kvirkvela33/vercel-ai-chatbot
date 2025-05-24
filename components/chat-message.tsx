'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  sender: 'user' | 'assistant';
  text: string;
}

export default function ChatMessage({ sender, text }: ChatMessageProps) {
  const isUser = sender === 'user';

  return (
    <div className={cn('w-full flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] md:max-w-md rounded-2xl px-4 py-3 text-sm md:text-base whitespace-pre-wrap shadow-md',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-neutral-200 text-neutral-900 rounded-bl-sm dark:bg-neutral-800 dark:text-neutral-100'
        )}
      >
        {text}
      </div>
    </div>
  );
}