"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  X,
  MessageCircle,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useChat, type ChatContext, type ChatMessage } from "@/hooks/use-chat";

// Typing indicator dots
function MiniTypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// Mini bot avatar
function MiniBotAvatar() {
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shrink-0">
      <Bot className="h-3 w-3 text-white" />
    </div>
  );
}

// Mini user avatar
function MiniUserAvatar() {
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
      <Sparkles className="h-3 w-3 text-white" />
    </div>
  );
}

// Compact message bubble for widget
function MiniChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {isUser ? <MiniUserAvatar /> : <MiniBotAvatar />}
      <div
        className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed max-w-[85%] ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-accent text-accent-foreground rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-xs chat-markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Widget popup content
function ChatWidgetPopup({ onClose }: { onClose: () => void }) {
  const [context] = useState<ChatContext>("general");
  const { messages, isLoading, sendMessage, clearChat } = useChat({ context });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-16 right-0 w-[340px] sm:w-[380px] h-[480px] rounded-2xl overflow-hidden shadow-2xl glass border border-border/50 flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearChat}
              aria-label="Clear chat"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {messages.map((message) => (
          <MiniChatBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex gap-2"
            >
              <MiniBotAvatar />
              <div className="bg-accent rounded-xl rounded-tl-sm">
                <MiniTypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Thinking..." : "Type a message..."}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-lg h-8 w-8 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Floating Action Button with badge
function ChatFab({ onClick, hasNewMessage }: { onClick: () => void; hasNewMessage: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-shadow duration-200 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open AI chat"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping-slow" />
      <MessageCircle className="h-6 w-6 relative z-10" />

      {/* Badge */}
      {hasNewMessage && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-20"
        >
          1
        </motion.span>
      )}
    </motion.button>
  );
}

// Main floating widget component
export function AIChatWidget() {
  const { aiChatOpen, setAiChatOpen, activeSection } = useAppStore();
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const hasAutoNotified = useRef(false);

  // Hide widget when on the AI Chat section
  const isOnAISection = activeSection === "ai";

  const toggleChat = useCallback(() => {
    const willOpen = !aiChatOpen;
    setAiChatOpen(willOpen);
    if (willOpen) {
      // Opening the chat clears the badge
      setHasNewMessage(false);
    }
  }, [aiChatOpen, setAiChatOpen]);

  // Simulate badge notification after some time if user hasn't opened chat
  useEffect(() => {
    if (!aiChatOpen && !isOnAISection && !hasAutoNotified.current) {
      hasAutoNotified.current = true;
      const timer = setTimeout(() => {
        setHasNewMessage(true);
      }, 15000); // Show badge after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [aiChatOpen, isOnAISection]);

  // Don't render the widget on the AI section
  if (isOnAISection) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Chat popup */}
      <AnimatePresence>
        {aiChatOpen && <ChatWidgetPopup onClose={toggleChat} />}
      </AnimatePresence>

      {/* FAB */}
      <ChatFab onClick={toggleChat} hasNewMessage={hasNewMessage} />
    </div>
  );
}
