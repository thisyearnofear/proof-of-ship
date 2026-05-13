/**
 * AI Assistant Agent — Platform helper chat
 * 
 * Helps users navigate the platform, understand projects,
 * and learn about x402 nanopayments. Free guide mode uses a contextual
 * responder; premium mode costs 0.005 USDC per message.
 * 
 * Tries providers in order: Featherless AI (DeepSeek-V3) → Google Gemini →
 * AIsa Perplexity Sonar → context-aware fallback.
 */

import { withNanopayment } from "@/lib/nanopayment";
import { getAisaFetch, AISA_BASE_URL, isAisaConfigured } from "@/server/aisaClient";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || "";
const FEATHERLESS_MODEL = "deepseek-ai/DeepSeek-V3-0324";
const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_MODEL = "gemini-2.0-flash";
const GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `You are the Proof of Ship AI Assistant — a helpful guide for a platform that tracks and funds blockchain projects using x402 nanopayments on Circle's Arc network.

Key platform features you should help users with:
- **Explore**: Browse projects across 7 ecosystems (Arc, Celo, Base, Linea, Arbitrum, Ethereum, Optimism)
- **Back**: Use AI agents (Underwriter, Scout, Verifier) to analyze projects. Each agent costs a small USDC micropayment via x402.
- **Submit**: Add your own project — just needs a name, description, GitHub URL, ecosystem, and category.
- **AI Agents**: The Underwriter ($0.05) scores project health, the Scout ($0.01) finds top projects, the Verifier ($0.01) checks code quality.
- **x402 Nanopayments**: Sub-cent USDC payments settled on Arc via Circle Gateway. Users deposit USDC, then each AI query deducts from their balance.

Keep responses concise (2-4 sentences). Be friendly and actionable. If asked about something outside the platform, briefly answer but guide back to platform features.`;

async function chatHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [], modelTier = "free" } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: "Message too long (max 500 chars)" });
  }

  try {
    let reply;
    let aiPayment = null;
    let resultSource = "contextual";
    let status = "ok";
    const usePremiumModel = modelTier === "premium";

    if (!usePremiumModel) {
      reply = getContextualReply(message);
      aiPayment = { provider: "contextual", model: "free-guide", status: "free" };
      resultSource = "free_guide";
    }

    if (!reply && FEATHERLESS_API_KEY) {
      try {
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-6).map(m => ({
            role: m.role,
            content: m.content.slice(0, 300),
          })),
          { role: "user", content: message },
        ];

        const featherlessRes = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${FEATHERLESS_API_KEY}`,
          },
          body: JSON.stringify({
            model: FEATHERLESS_MODEL,
            messages,
            max_tokens: 300,
          }),
        });

        if (featherlessRes.ok) {
          const data = await featherlessRes.json();
          reply = data.choices?.[0]?.message?.content || null;
          aiPayment = { provider: "featherless", model: FEATHERLESS_MODEL, status: "ok" };
          resultSource = "live_ai";
        }
      } catch (err) {
        console.warn("Featherless AI chat failed, trying Google Gemini:", err.message);
      }
    }

    if (!reply && GOOGLE_API_KEY) {
      try {
        const contents = [
          ...history.slice(-6).map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content.slice(0, 300) }] })),
          { role: "user", parts: [{ text: message }] },
        ];

        const googleRes = await fetch(
          `${GOOGLE_BASE_URL}/models/${GOOGLE_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents,
              generationConfig: { maxOutputTokens: 300 },
            }),
          }
        );

        if (googleRes.ok) {
          const data = await googleRes.json();
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
          aiPayment = { provider: "google", model: GOOGLE_MODEL, status: "ok" };
          resultSource = "live_ai";
        }
      } catch (err) {
        console.warn("Google Gemini chat failed, trying AIsa:", err.message);
      }
    }

    if (!reply && isAisaConfigured()) {
      try {
        const aisaFetch = getAisaFetch();
        const msgs = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-6).map(m => ({ role: m.role, content: m.content.slice(0, 300) })),
          { role: "user", content: message },
        ];
        const aisaRes = await aisaFetch(`${AISA_BASE_URL}/perplexity/sonar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sonar", messages: msgs, max_tokens: 300 }),
        });
        if (aisaRes.ok) {
          const data = await aisaRes.json();
          reply = data.choices?.[0]?.message?.content || null;
          aiPayment = { provider: "aisa-x402", model: "perplexity/sonar", status: "paid" };
          resultSource = "live_ai";
        }
      } catch (err) {
        console.warn("AIsa chat also failed, using contextual fallback:", err.message);
      }
    }

    if (!reply) {
      reply = getContextualReply(message);
      aiPayment = { provider: "contextual", model: usePremiumModel ? "premium-fallback" : "free-guide", status: usePremiumModel ? "fallback" : "free" };
      resultSource = usePremiumModel ? "fallback" : "free_guide";
      status = usePremiumModel ? "fallback" : "ok";
    }

    const cost = !usePremiumModel
      ? "free"
      : resultSource === "fallback"
        ? "0.005 USDC (fallback)"
        : "0.005 USDC";

    return res.status(200).json({
      agent: {
        type: "assistant",
        snsDomain: "pos-scout.sol",
        displayName: "pos-scout.sol",
        humanName: "Platform Assistant",
        icon: "🔭",
        description: "Platform helper assistant",
      },
      success: true,
      status,
      resultSource,
      nextAction: "Use one of the AI agent actions on the Back page when you're ready to analyze a project.",
      reply,
      agentInfo: {
        name: "pos-scout.sol",
        humanName: "Platform Assistant",
        cost,
        txHash: req.nanopayment?.txHash,
        network: "arc",
        paymentStatus: req.nanopayment?.demo ? "demo" : (req.nanopayment?.verificationStatus || "unverified"),
        ...(aiPayment && { aiPayment }),
      },
    });
  } catch (error) {
    console.error("Chat agent error:", error);
    return res.status(500).json({ error: "Assistant unavailable. Please try again.", status: "error" });
  }
}

function getContextualReply(message) {
  const lower = message.toLowerCase();

  if (lower.match(/hello|hi|hey|sup|what's up/)) {
    return "Hey! 👋 I'm the Proof of Ship assistant. I can help you explore projects, understand AI agents, or submit your own project. What would you like to do?";
  }
  if (lower.match(/submit|add|create|new project/)) {
    return "To submit a project, click **Submit Project** in the nav or go to /projects/new. You'll need a project name, description, GitHub URL, ecosystem, and category. Contract address is optional!";
  }
  if (lower.match(/agent|underwrite|scout|verify|ai/)) {
    return "We have 3 AI agents: **Underwriter** ($0.05) scores project health, **Scout** ($0.01) finds top projects across ecosystems, and **Verifier** ($0.01) checks code quality. Try them on the **Back** page → Economy tab!";
  }
  if (lower.match(/x402|nanopay|payment|usdc|cost|price/)) {
    return "x402 nanopayments let you pay small USDC amounts for AI analysis. Set up your payment wallet on the **Back** page to unlock stronger agent flows — demo mode also works for testing.";
  }
  if (lower.match(/explore|browse|find|search|project/)) {
    return "Head to the **Explore** page to browse projects across 7 ecosystems. Use the search bar to filter by name or category. Click any project for details and AI analysis!";
  }
  if (lower.match(/arc|circle|ecosystem/)) {
    return "Arc is Circle's USDC-native EVM network for fast stablecoin settlement. We use it so small AI analysis payments can settle cleanly in USDC.";
  }
  if (lower.match(/back|fund|invest|support/)) {
    return "The **Back** page lets you discover and support projects. Use AI agents to analyze projects before backing them. Your payment balance is shown there when you set it up.";
  }
  if (lower.match(/how|work|explain|what is/)) {
    return "Proof of Ship helps you explore projects, run AI analysis, and decide what to back. The core flow is: pick a project → run analysis → review the result → back with confidence.";
  }

  return "I can help you explore projects, use AI agents, submit your own project, or understand AI analysis payments. What would you like to do next?";
}

let paidChatHandlerPromise;
function getPaidChatHandler() {
  if (!paidChatHandlerPromise) {
    paidChatHandlerPromise = withNanopayment(chatHandler, 0.005);
  }
  return paidChatHandlerPromise;
}

export default async function handler(req, res) {
  if (req.method === "POST" && req.body?.modelTier !== "premium") {
    return chatHandler(req, res);
  }

  const paidChatHandler = await getPaidChatHandler();
  return paidChatHandler(req, res);
}
