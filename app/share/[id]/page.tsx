'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChatList } from '@/components/chat-list'
import { ChatListMessage } from '@/components/chat-list'
import { Separator } from '@/components/ui/separator'
import { FooterText } from '@/components/footer'

interface FetchedMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FetchedChat {
  messages: FetchedMessage[]
}

export default function SharePage() {
  const [chat, setChat] = useState<FetchedChat | null>(null)
  const params = useParams()

  useEffect(() => {
    async function fetchChat() {
      const res = await fetch(`/api/chat/${params.id}`)
      const data = await res.json()
      setChat(data)
    }

    if (params.id) {
      fetchChat()
    }
  }, [params.id])

  if (!chat) {
    return <div className="p-4 text-sm text-muted-foreground">Loading chat…</div>
  }

  const convertedMessages: ChatListMessage[] = chat.messages.map((m, i) => ({
    id: i,
    sender: m.role,
    text: m.content || '',
  }))

  return (
    <>
      <div className="flex flex-col space-y-4 px-4">
        <div className="text-center text-sm text-muted-foreground">
          Shared chat link
        </div>
        <Separator className="my-4" />
        <ChatList messages={convertedMessages} />
      </div>
      <FooterText className="py-8" />
    </>
  )
}