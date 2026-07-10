import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { agentsHref } from "@/config/navigation";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const QUICK_ACTIONS = [
  { label: "Analyze a project", href: agentsHref("analyze") },
  { label: "Run Scout", href: agentsHref("scout") },
  { label: "Compare projects", href: agentsHref("compare") },
  { label: "How do payments work?", message: "How do AI analysis payments work?" },
];

function describeSource(source) {
  switch (source) {
    case "local":
      return "on-device";
    case "free_guide":
      return "free guide";
    case "fallback":
      return "fallback";
    default:
      return source || "assistant";
  }
}

export default function AIChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = sessionStorage.getItem("ai-chat-dismissed");
      if (wasDismissed) setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    sessionStorage.setItem("ai-chat-dismissed", "true");
  };

  const handleReopen = () => {
    setDismissed(false);
    setOpen(true);
    sessionStorage.removeItem("ai-chat-dismissed");
  };

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

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let reply = null;
      let source = "cloud";
      let meta = null;

      try {
        const { qvacService } = await import("@/services/QvacService");
        const status = await qvacService.getStatus();
        if (status.available) {
          const result = await qvacService.complete({
            prompt: trimmed,
            systemPrompt:
              "You are the Proof of Ship navigation assistant. Be concise. Direct users to Back → Agents for paid analysis (Scout, Underwriter, Verifier).",
          });
          if (result.text) {
            reply = result.text;
            source = "local";
            meta = {
              status: "ok",
              nextAction: "Open Back → Agents when you are ready to run Scout or analyze a project.",
            };
          }
        }
      } catch {
        // ignore local inference errors
      }

      if (!reply) {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: messagesRef.current.slice(-6),
            modelTier: "free",
          }),
        });

        const data = await res.json();
        if (data.success && data.reply) {
          reply = data.reply;
          source = data.resultSource || "free_guide";
          meta = {
            status: data.status,
            nextAction: data.nextAction,
          };
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.error || "Sorry, I couldn't process that. Try again!" },
          ]);
          setLoading(false);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          source,
          meta,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleQuickAction = (action) => {
    if (action.href) {
      router.push(action.href);
      return;
    }
    sendMessage(action.message);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (dismissed && !open) {
    return (
      <button
        onClick={handleReopen}
        data-chat-toggle
        className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-indigo-600 hover:text-white text-gray-500 dark:text-gray-400 rounded-full shadow-md transition-all hover:scale-110 opacity-60 hover:opacity-100"
        aria-label="Reopen AI Assistant"
        title="Reopen AI Assistant (⌘J)"
      >
        <ChatBubbleLeftRightIcon className="w-4 h-4" />
      </button>
    );
  }

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          data-chat-toggle
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 group"
          aria-label="Open AI Assistant (⌘J)"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Ask AI</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full shadow transition-colors"
          aria-label="Dismiss AI Assistant"
          title="Dismiss"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
        onClick={() => setMinimized(false)}
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="text-sm font-medium">AI Guide</span>
        {messages.length > 0 && (
          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          <div>
            <div className="text-sm font-semibold">AI Guide</div>
            <div className="text-xs opacity-80">Navigation help — paid analysis lives in Agents</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Minimize chat"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
          <button
            onClick={() => setOpen(false)}
            data-chat-close
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close chat (Esc)"
            title="Close (Esc)"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Ask how to navigate Proof of Ship.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                For paid Scout, Underwriter, and Verifier runs, open{" "}
                <button
                  type="button"
                  onClick={() => router.push(agentsHref())}
                  className="text-indigo-600 dark:text-indigo-400 underline"
                >
                  Back → Agents
                </button>
                .
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleQuickAction(qa)}
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
              {msg.meta?.nextAction && (
                <p className="text-[10px] mt-2 opacity-70">Next: {msg.meta.nextAction}</p>
              )}
              {msg.source && (
                <p className="text-[10px] mt-1 opacity-60">Source: {describeSource(msg.source)}</p>
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

      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask how to explore, back, or analyze..."
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
