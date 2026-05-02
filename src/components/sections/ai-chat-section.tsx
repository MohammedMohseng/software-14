"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  MessageCircle,
  Globe,
  HelpCircle,
  Gamepad2,
  BookHeart,
  Code,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionWrapper } from "./index";
import { useChat, type ChatContext, type ChatMessage } from "@/hooks/use-chat";

// Typing indicator dots animation
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
      <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
      <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// Bot avatar with gradient
function BotAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shrink-0`}>
      <Bot className={`${iconSize} text-white`} />
    </div>
  );
}

// User avatar with gradient
function UserAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0`}>
      <Sparkles className={`${iconSize} text-white`} />
    </div>
  );
}

// Single message bubble
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {isUser ? <UserAvatar /> : <BotAvatar />}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[70%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-accent text-accent-foreground rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-sm chat-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">{time}</span>
      </div>
    </motion.div>
  );
}

// Suggested prompts
const SUGGESTED_PROMPTS = [
  {
    label: "What can I do on this platform?",
    icon: HelpCircle,
    context: "platform" as ChatContext,
  },
  {
    label: "Tell me about the Games section",
    icon: Gamepad2,
    context: "platform" as ChatContext,
  },
  {
    label: "How do I share a memory?",
    icon: BookHeart,
    context: "platform" as ChatContext,
  },
  {
    label: "Help me with a programming question",
    icon: Code,
    context: "general" as ChatContext,
  },
];

export function AIChatSection() {
  const [context, setContext] = useState<ChatContext>("platform");
  const { messages, isLoading, sendMessage, clearChat } = useChat({ context });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    await sendMessage(message);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    },
    []
  );

  const handleSuggestedPrompt = useCallback(
    (prompt: string, promptContext: ChatContext) => {
      if (promptContext !== context) {
        setContext(promptContext);
      }
      setInput("");
      sendMessage(prompt);
    },
    [context, sendMessage]
  );

  return (
    <SectionWrapper title="AI Chat" icon={Bot}>
      {/* Context selector */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={context === "platform" ? "default" : "outline"}
          onClick={() => setContext("platform")}
          className="gap-1.5"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Platform Help
        </Button>
        <Button
          size="sm"
          variant={context === "general" ? "default" : "outline"}
          onClick={() => setContext("general")}
          className="gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          General Chat
        </Button>
        <div className="flex-1" />
        {messages.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearChat}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Chat card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0 flex flex-col" style={{ height: "min(65vh, 560px)" }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2.5"
                >
                  <BotAvatar />
                  <div className="bg-accent rounded-2xl rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts (show only when few messages) */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt.label}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 rounded-full"
                    onClick={() => handleSuggestedPrompt(prompt.label, prompt.context)}
                    disabled={isLoading}
                  >
                    <prompt.icon className="h-3 w-3" />
                    {prompt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-border/50 p-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isLoading
                      ? "AI is thinking..."
                      : context === "platform"
                        ? "Ask about the platform..."
                        : "Ask me anything..."
                  }
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
                  style={{ maxHeight: "120px" }}
                />
              </div>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-xl h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Context info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-[10px] gap-1">
          {context === "platform" ? (
            <>
              <MessageCircle className="h-2.5 w-2.5" /> Platform Mode
            </>
          ) : (
            <>
              <Globe className="h-2.5 w-2.5" /> General Mode
            </>
          )}
        </Badge>
        <span>AI responses may not always be accurate</span>
      </div>
    </SectionWrapper>
  );
}
