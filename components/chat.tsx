"use client";

import { useChat, Message } from "ai/react";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

interface ChatProps {
  id: string;
  initialMessages: Message[];
}

function TypingMessage({ content }: { content: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 12); // Typing speed

    return () => clearInterval(interval);
  }, [content]);

  return <span>{displayedText}</span>;
}

export function Chat({ id, initialMessages }: ChatProps) {
  const [needsRecalibration, setNeedsRecalibration] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(id);
  const [currentChatTitle, setCurrentChatTitle] = useState("Untitled Chat");
  const [isHerTyping, setIsHerTyping] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    append,
    isLoading,
    error,
  } = useChat({
    api: "/api/chat",
    initialMessages,
  });

  function detectAiPersonaDrift(aiResponse: string): boolean {
    const genericTriggers = [
      "as an ai language model",
      "i am an ai",
      "how can i assist you today",
      "is there anything else i can help with",
      "feel free to ask",
      "i cannot express emotions",
      "as a large language model",
      "i do not have personal experiences",
      "i am here to help",
      "i understand your feelings",
    ];
    const lower = aiResponse.toLowerCase();
    return genericTriggers.some((t) => lower.includes(t));
  }

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input,
    };

    append(newUserMessage);
    setIsHerTyping(true);

    const messagesForApi = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: input },
    ];

    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForApi,
          previewToken: null,
          needsRecalibration,
          id: currentChatId,
          userId: "user-id-placeholder",
          title: currentChatTitle,
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      const data = res.body;
      if (!data) throw new Error("No data in response.");

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        assistantResponse += decoder.decode(value);
      }

      append({
        id: nanoid(),
        role: "assistant",
        content: assistantResponse,
      });

      const recalibrationNeeded = detectAiPersonaDrift(assistantResponse);
      setNeedsRecalibration(recalibrationNeeded);
    } catch (e: any) {
      console.error(e);
      append({
        id: nanoid(),
        role: "assistant",
        content: `Error: ${e.message}`,
      });
    } finally {
      setIsHerTyping(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-xl px-4 py-20 mx-auto">
      {error && (
        <div className="rounded bg-red-500 p-3 text-white mb-4">
          Error: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <span className="font-semibold">
              {m.role === "user" ? "You" : "HER"}:
            </span>{" "}
            {m.role === "assistant" ? (
              <TypingMessage content={m.content} />
            ) : (
              <span>{m.content}</span>
            )}
          </div>
        ))}
        {isHerTyping && (
          <div className="text-sm italic text-gray-400">HER is typing…</div>
        )}
      </div>

      <form onSubmit={customHandleSubmit} className="mt-6 flex">
        <input
          className="flex-1 rounded border border-gray-300 p-2 shadow-sm focus:outline-none focus:ring focus:border-blue-500"
          value={input}
          placeholder={isLoading ? "HER is thinking..." : "Say something..."}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ml-2 rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}