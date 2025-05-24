'use client'; // This line is crucial for client-side rendering in Next.js App Router

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SendHorizonal, Copy, Sparkles } from 'lucide-react';

// IMPORTANT: Ensure you have installed these packages:
// npm install react-markdown react-syntax-highlighter lucide-react
// or
// yarn add react-markdown react-syntax-highlighter lucide-react

// Define interfaces for message and component props
interface Message {
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean; // Optional, as it's primarily for AI messages during initial display
}

interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  onSummarize: (text: string) => void;
  onElaborate: (text: string) => void;
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
    <div className="flex items-center space-x-1 py-2 px-3 bg-gray-100 rounded-xl rounded-bl-sm shadow-sm max-w-xs">
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
const MessageBubble = ({ message, isStreaming, onSummarize, onElaborate, isLLMLoading }: MessageBubbleProps) => {
  const messageRef = useRef(null);
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code); // Using modern clipboard API
    // In a real app, you'd show a "Copied!" toast/message
  };

  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="relative my-2 rounded-md overflow-hidden">
          <SyntaxHighlighter
            style={atomDark}
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
        <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>
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
            : 'bg-gray-100 text-gray-800 rounded-bl-sm mr-auto'
        }`}
      >
        <ReactMarkdown components={components}>
          {displayedText}
        </ReactMarkdown>
        {message.sender === 'ai' && (
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => onSummarize(message.text)}
              disabled={isLLMLoading}
              className="flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Sparkles size={12} className="mr-1" /> Summarize
            </button>
            <button
              onClick={() => onElaborate(message.text)}
              disabled={isLLMLoading}
              className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Sparkles size={12} className="mr-1" /> Elaborate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [messages, setMessages] = useState<Message[]>([]); // Explicitly type useState
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Type useRef
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Type useRef

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
  const callChatBackend = async (prompt: string) => { // Type prompt
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

      // Assuming your /api/chat returns a JSON object with a 'content' field
      const data = await response.json();
      const aiResponseText = data.content || "Error: No response content from AI.";

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'ai', text: aiResponseText, isStreaming: false }, // Set to false, as streaming is handled by backend
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

    const userMessage: Message = { sender: 'user', text: input.trim() }; // Type userMessage
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    // Call your OpenAI backend via /api/chat
    await callChatBackend(input.trim());
  };

  const handleSummarize = async (textToSummarize: string) => { // Type textToSummarize
    if (isLLMLoading) return;
    const prompt = `Summarize the following text concisely:\n\n${textToSummarize}`;
    await callChatBackend(prompt);
  };

  const handleElaborate = async (textToElaborate: string) => { // Type textToElaborate
    if (isLLMLoading) return;
    const prompt = `Elaborate on the following text, providing more detail and context:\n\n${textToElaborate}`;
    await callChatBackend(prompt);
  };

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
      setInput(generatedPrompt); // Set the generated prompt into the input box
    } catch (error) {
      console.error("Error calling chat backend for prompt suggestion:", error);
      // Optionally, show a message to the user
    } finally {
      setIsLLMLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { // Type event
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line in textarea
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-inter antialiased">
      {/* Chat History Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-20"> {/* pb-20 to ensure space for fixed input */}
        <div className="max-w-screen-md mx-auto">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg}
              isStreaming={msg.isStreaming || false} // Ensure isStreaming is always boolean
              onSummarize={handleSummarize}
              onElaborate={handleElaborate}
              isLLMLoading={isLLMLoading}
            />
          ))}
          {(isTyping || isLLMLoading) && (
            <div className="flex justify-start mb-4">
              <AIAvatar />
              <TypingDots />
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 md:p-6 border-t border-gray-200">
        <div className="max-w-screen-md mx-auto flex flex-col items-end">
          {/* Suggest Prompt Button */}
          <button
            onClick={handleSuggestPrompt}
            disabled={isLLMLoading}
            className="mb-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-full hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500 flex items-center self-start"
          >
            <Sparkles size={16} className="mr-2" /> Suggest Prompt
          </button>

          <div className="flex items-end w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLLMLoading ? "Generating response..." : "Message HER.ai..."}
              rows={1}
              className="flex-grow resize-none overflow-hidden bg-gray-100 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              style={{ maxHeight: '120px' }}
              disabled={isLLMLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={input.trim() === '' || isLLMLoading}
              className={`ml-3 p-2 rounded-full transition-colors duration-200 ${
                input.trim() === '' || isLLMLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title="Send message"
            >
              <SendHorizonal size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
