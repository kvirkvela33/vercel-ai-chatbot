'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface ChatProps {
  id: string;
  initialMessages: Message[];
}

// Typing animation component
function TypingMessage({ content }: { content: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 15); // Adjust typing speed here

    return () => clearInterval(interval);
  }, [content]);

  return <span>{displayedText}</span>;
}

export function Chat({ id, initialMessages }: ChatProps) {
  const [needsRecalibration, setNeedsRecalibration] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(id);
  const [currentChatTitle, setCurrentChatTitle] = useState('Untitled Chat');
  const [isHerTyping, setIsHerTyping] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    append,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    initialMessages,
  });

  function detectAiPersonaDrift(aiResponse: string): boolean {
    const genericTriggers = [
      'as an ai language model',
      'i am an ai',
      'how can i assist you today',
      'is there anything else i can help with',
      'feel free to ask',
      'let me know if you have any other questions',
      'i cannot express emotions',
      'as a large language model',
      'i do not have personal experiences',
      'i am here to help',
      'i understand your feelings',
    ];
    const lower = aiResponse.toLowerCase();
    return genericTriggers.some(trigger => lower.includes(trigger));
  }

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: input
    };

    append(newUserMessage);
    setIsHerTyping(true);

    const messagesForApi = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: input }
    ];

    handleInputChange({
      target: { value: '' }
    } as React.ChangeEvent<HTMLInputElement>);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi,
          previewToken: null,
          needsRecalibration,
          id: currentChatId,
          userId: 'user-id-placeholder',
          title: currentChatTitle,
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      const data = res.body;
      if (!data) throw new Error('No data in response.');

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        assistantResponse += decoder.decode(value);
      }

      append({
        id: nanoid(),
        role: 'assistant',
        content: assistantResponse
      });

      const recalibrationNeeded = detectAiPersonaDrift(assistantResponse);
      setNeedsRecalibration(recalibrationNeeded);
    } catch (e: any) {
      console.error(e);
      append({
        id: nanoid(),
        role: 'assistant',
        content: `Error: ${e.message}`
      });
    } finally {
      setIsHerTyping(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && (
        <div className="rounded-md bg-red-500 p-4 text-white">
          Error: {error.message}
        </div>
      )}

      {messages.length > 0 ? (
        <>
          {messages.map((m) => (
            <div key={m.id} className="whitespace-pre-wrap mb-2">
              <strong>{m.role === 'user' ? 'You: ' : 'HER: '}</strong>
              {m.role === 'assistant' ? (
                <TypingMessage content={m.content} />
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          ))}
          {isHerTyping && (
            <div className="text-sm italic text-gray-400 mb-2">HER is typing…</div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Start chatting with HER...</div>
      )}

      <form onSubmit={customHandleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder={isLoading ? 'HER is thinking...' : 'Say something...'}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" className="hidden">Send</button>
      </form>
    </div>
  );
}