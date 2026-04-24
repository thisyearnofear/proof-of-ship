/**
 * AI Chat Widget — Floating assistant accessible from any page
 * 
 * Helps users navigate the platform via conversational AI.
 * Each message costs 0.005 USDC via x402 nanopayment (free in demo mode).
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";

const QUICK_ACTIONS = [
  { label: "How does x402 work?", message: "How do x402 nanopayments work on this platform?" },
  { label: "Submit a project", message: "How do I submit a project?" },
  { label: "Try AI agents", message: "Tell me about the AI agents" },
  { label: "Explore projects", message: "How do I explore and find projects?" },
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-key": "demo",
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, cost: data.agentInfo?.cost },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Sorry, I couldn't process that. Try again!" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 group"
        aria-label="Open AI Assistant"
      >
        <ChatBubbleLeftRightIcon className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Ask AI</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          <div>
            <div className="text-sm font-semibold">AI Assistant</div>
            <div className="text-xs opacity-80">$0.005/msg · x402 on Arc</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">👋 Hi! I&apos;m your Proof of Ship assistant.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ask me anything about the platform, projects, AI agents, or x402 payments.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => sendMessage(qa.message)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 transition-colors text-gray-600 dark:text-gray-400"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.cost && (
                <p className="text-[10px] mt-1 opacity-60">⚡ {msg.cost}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            maxLength={500}
            disabled={loading}
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
