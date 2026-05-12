/**
 * AI Chat Widget — Floating assistant accessible from any page
 * 
 * Helps users navigate the platform via conversational AI.
 * Free guide mode is available immediately. Premium mode uses paid x402-backed models.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNanopayment } from "@/contexts/WalletContext";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon, CreditCardIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

const QUICK_ACTIONS = [
  { label: "How does x402 work?", message: "How do x402 nanopayments work on this platform?" },
  { label: "Submit a project", message: "How do I submit a project?" },
  { label: "Try AI agents", message: "Tell me about the AI agents" },
  { label: "Explore projects", message: "How do I explore and find projects?" },
];

export default function AIChatWidget() {
  const { nanopaymentDemoMode } = useNanopayment();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [modelTier, setModelTier] = useState("free");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);
  
  // Keep messagesRef in sync for use in callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Check if user previously dismissed the widget and restore preferred tier
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = sessionStorage.getItem("ai-chat-dismissed");
      if (wasDismissed) setDismissed(true);
      const savedTier = localStorage.getItem("ai-chat-tier");
      if (savedTier === "premium" || savedTier === "free") setModelTier(savedTier);
    }
  }, []);

  // Persist tier preference across sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-chat-tier", modelTier);
    }
  }, [modelTier]);

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

  // Try QVAC local inference first, fall back to cloud API
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setPaymentError(null);
    const requestedTier = modelTier;

    try {
      // Attempt QVAC local-first inference (project data stays on-device)
      let reply = null;
      let source = "cloud";

      try {
        const { qvacService } = await import("@/services/QvacService");
        const status = await qvacService.getStatus();
        // QVAC is free/local-only; premium intentionally bypasses to use the remote x402 model.
        if (requestedTier === "free" && status.available) {
          const result = await qvacService.complete({
            prompt: trimmed,
            systemPrompt: "You are the Proof of Ship AI assistant. Be concise and helpful.",
          });
          if (result.text) {
            reply = result.text;
            source = "local";
          }
        }
      } catch {
        // QVAC not available, fall through to cloud API
      }

      // Cloud fallback (Featherless -> AIsa -> contextual)
      if (!reply) {
        const headers = {
          "Content-Type": "application/json",
        };
        if (nanopaymentDemoMode) {
          headers["x-demo-key"] = "demo";
        }

        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmed,
            history: messagesRef.current.slice(-6),
            modelTier: requestedTier,
          }),
        });

        // Handle 402 Payment Required with interactive card
        if (res.status === 402) {
          const data = await res.json();
          setPaymentError({
            message: data.message || "Payment required to use AI assistant",
            amount: data.priceUSD || 0.005,
            demo: data.demo,
            instructions: data.instructions,
          });

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Premium AI requires a nanopayment. You can keep using the free guide, or set up x402 payments for stronger models.",
              type: "payment_required",
            },
          ]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success && data.reply) {
          reply = data.reply;
          source = "cloud";
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.error || "Sorry, I couldn't process that. Try again!" },
          ]);
          setLoading(false);
          return;
        }
      }

      // Display the reply with source indicator
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          source,
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
  }, [input, loading, modelTier]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Fully dismissed — show tiny re-open pill
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

  // Floating button (not dismissed, not open)
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

  // Minimized state — compact bar
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
        onClick={() => setMinimized(false)}
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="text-sm font-medium">AI Assistant</span>
        {messages.length > 0 && (
          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          <div>
            <div className="text-sm font-semibold">AI Assistant</div>
            <div className="text-xs opacity-80">{modelTier === "free" ? "Free guide" : "$0.005/msg · x402 on Arc"}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Minimize chat"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Hi, I&apos;m your Proof of Ship assistant.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start with the free guide. Switch to premium when you want stronger model reasoning via x402.
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
                  : msg.type === "payment_required"
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.cost && (
                <p className="text-[10px] mt-1 opacity-60">⚡ {msg.cost}</p>
              )}
              {msg.source === "local" && (
                <p className="text-[10px] mt-1 opacity-60 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  on-device (QVAC)
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Interactive Payment Card */}
        {paymentError && (
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-amber-200 dark:border-amber-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  <span className="font-semibold">Premium AI Payment</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${paymentError.amount?.toFixed(3) || "0.005"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">per premium message via USDC</div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">How it works:</span> The free guide stays available. Premium model calls settle on Circle&apos;s Arc L2 via x402.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      window.location.href = '/back?tab=economy';
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                    Setup x402
                  </button>
                  <button
                    onClick={() => {
                      // Remove the payment required message from chat history
                      setMessages(prev => prev.filter((_, idx) => {
                        const paymentMsgIndex = prev.findIndex(
                          m => m.type === 'payment_required'
                        );
                        return idx !== paymentMsgIndex;
                      }));
                      setPaymentError(null);
                      // Leave modelTier as-is — user can switch back via the toggle.
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

                {paymentError.demo && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Demo mode: Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">x-demo-key: demo</code> header to test free
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
        <div
          role="tablist"
          aria-label="AI model tier"
          className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={modelTier === "free"}
            onClick={() => {
              setModelTier("free");
              setPaymentError(null);
            }}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              modelTier === "free"
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Free guide
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modelTier === "premium"}
            onClick={() => setModelTier("premium")}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              modelTier === "premium"
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Premium AI
          </button>
        </div>
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
