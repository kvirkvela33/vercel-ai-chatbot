'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { IconArrowUp } from '@/components/ui/icons'

interface PromptFormProps {
  id?: string
  input: string
  isLoading: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  stop: () => void
}

export function PromptForm({
  id,
  input,
  isLoading,
  handleInputChange,
  handleSubmit,
}: PromptFormProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 border-t bg-background px-3 py-2 sm:px-4 sm:py-3"
    >
      <input
        ref={inputRef}
        name="prompt"
        placeholder="Type your message..."
        value={input}
        onChange={handleInputChange}
        disabled={isLoading}
        className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none max-w-[100%] sm:max-w-[calc(100%-48px)]"
      />
      <Button type="submit" size="icon" disabled={isLoading}>
        <IconArrowUp />
      </Button>
    </form>
  )
}