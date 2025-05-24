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
    <div className="flex flex-col gap-4 px-4">
      {messages.map((message) => (
        <div key={message.id}>
          <ChatMessage sender={message.sender} text={message.text} />
          <Separator className="my-4" />
        </div>
      ))}
    </div>
  )
}