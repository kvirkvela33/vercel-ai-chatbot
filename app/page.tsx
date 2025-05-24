'use client'; // This line is crucial for client-side rendering in Next.js App Router

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SendHorizonal, Copy, Sparkles, Sun, Moon, Mic, Search, Layout } from 'lucide-react'; // Added Mic, Search, Layout icons
import { useTheme } from 'next-themes'; // Import useTheme hook

// IMPORTANT: Ensure you have installed these packages:
// npm install react-markdown react-syntax-highlighter lucide-react next-themes
// or
// yarn add react-markdown react-syntax-highlighter lucide-react next-themes

// Define interfaces for message and component props
interface Message {
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean; // Optional, as it's primarily for AI messages during initial display
}

interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  onSummarize: (text: string) => void; // Keeping these props for now, but buttons are removed
  onElaborate: (text: string) => void; // Keeping these props for now, but buttons are removed
  isLLMLoading: boolean;
}

// Custom component for the AI's avatar
const AIAvatar = () => (
  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mr-2">
    G
  </div>
);

// Component for the typing dots animation
const TypingDots = () => {
  return (
    <div className="flex items-center space-x-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded-xl rounded-bl-sm shadow-sm max-w-xs">
      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .dot {
          width: 6px;
          height: 6px;
          background-color: #4a5568; /* Dark gray */
          border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
};

// Component for rendering a single chat message
const MessageBubble = ({ message, isStreaming, isLLMLoading }: MessageBubbleProps) => { // Removed onSummarize, onElaborate from destructuring
  const messageRef = useRef<HTMLDivElement>(null);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (isStreaming && message.sender === 'ai') {
      let i = 0;
      const intervalId = setInterval(() => {
        if (i < message.text.length) {
          setDisplayedText((prev) => prev + message.text[i]);
          i++;
          // Scroll to bottom as text streams
          if (messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        } else {
          clearInterval(intervalId);
        }
      }, 20); // Adjust typing speed here (ms per character)
      return () => clearInterval(intervalId);
    } else {
      setDisplayedText(message.text);
    }
  }, [message.text, isStreaming, message.sender]);

  // Handle message entry animation
  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code); // Using modern clipboard API
    // In a real app, you'd show a "Copied!" toast/message
  };

  const components: Components = { // Apply Components type here
    code({
      node,
      inline,
      className,
      children,
      ...props
    }: {
      node: any; // 'node' type can be complex, 'any' is often used here for simplicity
      inline?: boolean;
      className?: string;
      children: React.ReactNode; // Use React.ReactNode for children
    }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="relative my-2 rounded-md overflow-hidden">
          <SyntaxHighlighter
            style={atomDark} // This style is dark, so it works well in both modes for code blocks
            language={match[1]}
            PreTag="div"
            {...props}
            className="rounded-md p-4 text-sm"
          >
            {codeContent}
          </SyntaxHighlighter>
          <button
            onClick={() => handleCopyCode(codeContent)}
            className="absolute top-2 right-2 p-1 bg-gray-700 text-white rounded-md text-xs hover:bg-gray-600 transition-colors flex items-center"
            title="Copy code"
          >
            <Copy size={14} className="mr-1" /> Copy
          </button>
        </div>
      ) : (
        <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 ml-4">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div
      ref={messageRef}
      className={`flex mb-4 transition-all duration-300 ease-out ${
        message.sender === 'user' ? 'justify-end' : 'justify-start'
      } ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {message.sender === 'ai' && <AIAvatar />}
      <div
        className={`max-w-[70%] p-3 rounded-xl shadow-sm ${
          message.sender === 'user'
            ? 'bg-blue-600 text-white rounded-br-sm ml-auto'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm mr-auto'
        }`}
      >
        <ReactMarkdown components={components}>
          {displayedText}
        </ReactMarkdown>
        {/* Removed Summarize and Elaborate buttons */}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme, setTheme } = useTheme();

  // Scroll to bottom of chat history
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isLLMLoading, scrollToBottom]);

  // Helper function to call your /api/chat backend
  const callChatBackend = async (prompt: string) => {
    setIsLLMLoading(true); // Indicate LLM operation is in progress
    setIsTyping(true); // Show typing indicator

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: prompt }] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponseText = data.content || "Error: No response content from AI.";

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'ai', text: aiResponseText, isStreaming: false },
      ]);
    } catch (error) {
      console.error("Error calling chat backend:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'ai', text: "Error: Failed to connect to AI backend." },
      ]);
    } finally {
      setIsLLMLoading(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLLMLoading) return;

    const userMessage: Message = { sender: 'user', text: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    await callChatBackend(input.trim());
  };

  // Removed handleSummarize and handleElaborate functions as buttons are gone

  const handleSuggestPrompt = async () => {
    if (isLLMLoading) return;
    const prompt = "Generate a creative and interesting chat prompt for a large language model. Make it concise and directly usable as a prompt.";
    setIsLLMLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedPrompt = data.content ? data.content.trim() : "";
      setInput(generatedPrompt);
    } catch (error) {
      console.error("Error calling chat backend for prompt suggestion:", error);
    } finally {
      setIsLLMLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    // Apply dark mode classes to the main container
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-inter antialiased text-gray-900 dark:text-gray-100">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Chat History Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-20">
        <div className="max-w-screen-md mx-auto">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg}
              isStreaming={msg.isStreaming || false}
              onSummarize={() => {}} // Pass empty functions as props are still expected by interface
              onElaborate={() => {}} // Pass empty functions
              isLLMLoading={isLLMLoading}
            />
          ))}
          {(isTyping || isLLMLoading) && (
            <div className="flex justify-start mb-4">
              <AIAvatar />
              <TypingDots />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 shadow-lg p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-md mx-auto flex flex-col items-center"> {/* Centered content */}
          <div className="flex items-end w-full max-w-2xl bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-3 border border-gray-200 dark:border-gray-700"> {/* Wider input container */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLLMLoading ? "Generating response..." : "Ask Gemini"} // Updated placeholder
              rows={1}
              className="flex-grow resize-none overflow-hidden bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-200"
              style={{ maxHeight: '120px' }}
              disabled={isLLMLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={input.trim() === '' || isLLMLoading}
              className={`ml-3 p-2 rounded-full transition-colors duration-200 ${
                input.trim() === '' || isLLMLoading
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Send message"
            >
              <SendHorizonal size={24} />
            </button>
            <button
              className="ml-2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Voice input"
              disabled={isLLMLoading}
            >
              <Mic size={24} />
            </button>
          </div>
          {/* Buttons below the input field */}
          <div className="flex mt-3 space-x-4">
            <button
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={isLLMLoading}
            >
              <Search size={16} className="mr-2" /> Deep Research
            </button>
            <button
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={isLLMLoading}
            >
              <Layout size={16} className="mr-2" /> Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
