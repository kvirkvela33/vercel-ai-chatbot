'use client';

import React from 'react';
import clsx from 'clsx';

type Props = {
  sender: 'user' | 'assistant';
  text: string;
};

export default function ChatMessage({ sender, text }: Props) {
  const isUser = sender === 'user';

  return (
    <div
      className={clsx(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={clsx(
          'rounded-lg px-4 py-2 text-sm max-w-[75%] whitespace-pre-wrap',
          isUser
            ? 'bg-surfaceUser text-white'
            : 'bg-surface text-white'
        )}
      >
        {text}
      </div>
    </div>
  );
}