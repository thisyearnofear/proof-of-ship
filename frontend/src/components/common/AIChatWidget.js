import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNanopayment } from "@/stores/walletStore";
import { agentsHref } from "@/config/navigation";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon, CreditCardIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

const QUICK_ACTIONS = [
  { label: "How do I analyze a project?", message: "How do I analyze a project before backing it?" },
  { label: "Where do I run Scout?", message: "Where do I run Scout?" },
  { label: "How do payments work?", message: "How do AI analysis payments work?" },
  { label: "How do I submit a project?", message: "How do I submit a project?" },
];

function describeSource(source) {
  switch (source) {
    case "local":
      return "on-device";
    case "free_guide":
      return "free guide";
    case "live_ai":
      return "live AI";
    case "fallback":
      return "fallback";
    default:
      return source || "assistant";
  }
}

export default function AIChatWidget() {
  const { payForAgent } = useNanopayment();
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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = sessionStorage.getItem("ai-chat-dismissed");
      if (wasDismissed) setDismissed(true);
      const savedTier = localStorage.getItem("ai-chat-tier");
      if (savedTier === "premium" || savedTier === "free") setModelTier(savedTier);
    }
  }, []);

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
      let reply = null;
      let source = "cloud";
      let meta = null;

      try {
        const { qvacService } = await import("@/services/QvacService");
        const status = await qvacService.getStatus();
        if (requestedTier === "free" && status.available) {
          const result = await qvacService.complete({
            prompt: trimmed,
            systemPrompt: "You are the Proof of Ship AI assistant. Be concise and helpful.",
          });
          if (result.text) {
            reply = result.text;
            source = "local";
            meta = { status: "ok", nextAction: "Use Back → Discover when you are ready to run Scout or review a project." };
          }
        }
      } catch {
        // ignore local inference errors
      }

      if (!reply && requestedTier === "premium") {
        try {
          const result = await payForAgent('chat', {
            message: trimmed,
            history: messagesRef.current.slice(-6),
          });

          if (result.success && result.data?.reply) {
            reply = result.data.reply;
            source = result.data.resultSource || "live_ai";
            meta = {
              status: result.data.status,
              nextAction: result.data.nextAction,
              paymentStatus: result.data.agentInfo?.paymentStatus,
            };
          } else if (result.status === 'payment_required') {
            setPaymentError({
              message: "Payment required to use AI assistant",
              amount: 0.005,
            });
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "Premium guidance needs a payment wallet first. Set one up on the AI Agents workspace to continue.",
                type: "payment_required",
              },
            ]);
            setLoading(false);
            return;
          } else {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: result.error || "Sorry, I couldn't process that. Try again!" },
            ]);
            setLoading(false);
            return;
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Payment setup is incomplete. Open the AI Agents workspace to set up your wallet, then try premium again." },
          ]);
          setLoading(false);
          return;
        }
      }

      if (!reply) {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: messagesRef.current.slice(-6),
            modelTier: requestedTier,
          }),
        });

        const data = await res.json();
        if (data.success && data.reply) {
          reply = data.reply;
          source = data.resultSource || "cloud";
          meta = {
            status: data.status,
            nextAction: data.nextAction,
            paymentStatus: data.agentInfo?.paymentStatus,
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
  }, [input, loading, modelTier, payForAgent]);

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
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          <div>
            <div className="text-sm font-semibold">AI Assistant</div>
            <div className="text-xs opacity-80">{modelTier === "free" ? "Free guide" : "$0.005 premium guidance"}</div>
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

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Start here, then switch to a real agent action.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use the free guide for navigation. Use premium only when you want stronger guidance before moving into the Back analysis flow.
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
              {msg.meta?.nextAction && (
                <p className="text-[10px] mt-2 opacity-70">Next: {msg.meta.nextAction}</p>
              )}
              {msg.source && (
                <p className="text-[10px] mt-1 opacity-60">
                  Source: {describeSource(msg.source)}{msg.meta?.paymentStatus ? ` · ${msg.meta.paymentStatus}` : ""}
                </p>
              )}
            </div>
          </div>
        ))}

        {paymentError && (
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-amber-200 dark:border-amber-700 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  <span className="font-semibold">Set up payment first</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${paymentError.amount?.toFixed(3) || "0.005"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">per premium guidance message</div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Recommended path:</span> open the AI Agents workspace to set up your payment wallet, then switch back to premium guidance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      window.location.href = agentsHref("analyze");
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                    Open AI Agents
                  </button>
                  <button
                    onClick={() => {
                      setMessages(prev => prev.filter((_, idx) => {
                        const paymentMsgIndex = prev.findIndex(
                          m => m.type === 'payment_required'
                        );
                        return idx !== paymentMsgIndex;
                      }));
                      setPaymentError(null);
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
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
            Premium guide
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the analysis flow..."
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
