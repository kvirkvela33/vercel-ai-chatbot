'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ChatMessageProps {
  id?: string
  sender: 'user' | 'assistant'
  text: string
}

export default function ChatMessage({ sender, text }: ChatMessageProps) {
  const isUser = sender === 'user'

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'whitespace-pre-wrap rounded-xl px-4 py-2 text-sm shadow-md transition-all',
          'max-w-[88%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {text}
      </div>
    </div>
  )
}