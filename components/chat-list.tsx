'use client'

import { Separator } from '@/components/ui/separator'
import ChatMessage from '@/components/chat-message'

export interface ChatListMessage {
  id: number
  sender: 'user' | 'assistant'
  text: string
}

export interface ChatListProps {
  messages: ChatListMessage[]
}

export function ChatList({ messages }: ChatListProps) {
  return (
    <div className="flex flex-col gap-1 px-2">
      {messages.map((message, index) => (
        <div key={message.id}>
          <ChatMessage sender={message.sender} text={message.text} />
          {index < messages.length - 1 && <div className="h-1" />}
        </div>
      ))}
    </div>
  )
}