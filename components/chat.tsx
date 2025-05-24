'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { ChatList } from '@/components/chat-list'
import { EmptyScreen } from '@/components/empty-screen'
import { PromptForm } from '@/components/prompt-form'
import { useChat } from 'ai/react'

export function Chat({ id }: { id?: string }) {
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    stop,
  } = useChat({
    id,
    api: '/api/chat',
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
    return () => clearTimeout(timeout)
  }, [messages.length])

  return (
    <div className="w-full h-full max-w-[700px] mx-auto px-1 sm:px-2 md:px-4">
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 overflow-y-auto px-1 pt-4">
          {messages.length === 0 ? (
            <EmptyScreen />
          ) : (
            <div className="flex flex-col gap-1 pb-2">
              <ChatList messages={messages} />
              <div ref={scrollRef} />
            </div>
          )}
        </div>
        <div className="sticky bottom-0 w-full border-t bg-background">
          <PromptForm
            id={id}
            input={input}
            isLoading={isLoading}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            stop={stop}
          />
        </div>
      </div>
    </div>
  )
}