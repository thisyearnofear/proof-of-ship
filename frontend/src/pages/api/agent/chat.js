/**
 * AI Assistant Agent — Platform helper chat
 * 
 * Helps users navigate the platform, understand projects,
 * and learn about x402 nanopayments. Costs 0.005 USDC per message.
 * 
 * Uses AIsa Perplexity Sonar when configured, falls back to
 * context-aware responses in demo mode.
 */

import { withNanopayment } from "@/lib/nanopayment";
import { getAisaFetch, AISA_BASE_URL, isAisaConfigured } from "@/lib/aisaClient";

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

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: "Message too long (max 500 chars)" });
  }

  try {
    let reply;
    let aisaPayment = null;

    if (isAisaConfigured()) {
      try {
        const aisaFetch = getAisaFetch();
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-6).map(m => ({
            role: m.role,
            content: m.content.slice(0, 300),
          })),
          { role: "user", content: message },
        ];

        const aisaRes = await aisaFetch(`${AISA_BASE_URL}/perplexity/sonar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages,
            max_tokens: 300,
          }),
        });

        if (aisaRes.ok) {
          const data = await aisaRes.json();
          reply = data.choices?.[0]?.message?.content || null;
          aisaPayment = { provider: "aisa-x402", model: "perplexity/sonar", status: "paid" };
        }
      } catch (err) {
        console.warn("AIsa chat failed, using fallback:", err.message);
      }
    }

    // Fallback: context-aware responses
    if (!reply) {
      reply = getContextualReply(message);
    }

    return res.status(200).json({
      success: true,
      reply,
      agentInfo: {
        name: "Platform Assistant",
        cost: "0.005 USDC",
        txHash: req.nanopayment?.txHash,
        network: "arc",
        ...(aisaPayment && { aisaPayment }),
      },
    });
  } catch (error) {
    console.error("Chat agent error:", error);
    return res.status(500).json({ error: "Assistant unavailable. Please try again." });
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
    return "x402 nanopayments let you pay sub-cent amounts for AI queries. Your USDC is settled on Arc via Circle Gateway. Initialize your wallet on the **Back** page to get started — demo mode works without real funds!";
  }
  if (lower.match(/explore|browse|find|search|project/)) {
    return "Head to the **Explore** page to browse projects across 7 ecosystems. Use the search bar to filter by name or category. Click any project for details and AI analysis!";
  }
  if (lower.match(/arc|circle|ecosystem/)) {
    return "Arc is Circle's EVM L2 with zero gas fees, making it perfect for micropayments. Our platform uses x402 nanopayments on Arc to pay for AI agent queries — each settled in USDC via Circle Gateway.";
  }
  if (lower.match(/back|fund|invest|support/)) {
    return "The **Back** page lets you discover and support projects. Use AI agents to analyze projects before backing them. Your nanopayment balance shows in the navbar — click it to manage your wallet!";
  }
  if (lower.match(/how|work|explain|what is/)) {
    return "Proof of Ship tracks blockchain projects and lets you analyze them with AI agents paid via x402 micropayments. Flow: Explore projects → Run AI analysis (costs micro USDC) → Back projects you believe in. All payments settle on Arc!";
  }

  return "I can help you explore projects, use AI agents, submit your own project, or understand x402 nanopayments. What would you like to know more about?";
}

export default await withNanopayment(chatHandler, 0.005);
