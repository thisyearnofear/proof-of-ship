/**
 * AI Underwriter Agent — Evaluates a single project and generates a health score.
 * 
 * GET /api/agent/underwrite?projectId=<id>
 * 
 * This endpoint demonstrates the "Per-API Monetization Engine" for the lablab.ai hackathon.
 * It requires a nanopayment of 0.05 USDC to run the AI scoring models.
 */

import { db } from "@/lib/firebase/serverOnly";
import { computeScore, getRecommendation, computeStrategicAdvice } from "@/lib/scoringEngine";
import { withNanopayment } from "@/lib/nanopayment";
import { getAisaFetch, AISA_BASE_URL, isAisaConfigured } from "@/server/aisaClient";
import { getCachedResult, setCachedResult } from "@/lib/agentCache";
import { agentIdentityResponse, getAgentIdentity } from "@/lib/agentIdentity";
import { withAgentAuth } from "@/lib/agentAuth";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId, fresh } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId query parameter is required" });
  }

  try {
    const identity = getAgentIdentity('underwrite');
    // 0. Check cache (skip if ?fresh=1)
    if (fresh !== "1") {
      const cached = await getCachedResult("underwrite", { projectId });
      if (cached) {
        return res.status(200).json({
          ...cached.data,
          status: "ok",
          resultSource: "cached",
          nextAction: "Review the health score and decide whether to back this project.",
          cached: true,
          cachedAt: cached.cachedAt,
          cachedAge: cached.ageHuman,
        });
      }
    }

    // 1. Fetch project data from Firestore
    const docRef = db.collection("projects").doc(projectId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Project not found", status: "error" });
    }

    const project = { id: snapshot.id, ...snapshot.data() };

    // 2. Run the AI Scoring Engine
    const { total, breakdown } = computeScore(project);
    const recommendation = getRecommendation(total);
    const strategicAdvice = computeStrategicAdvice(project);

    // 3. Enrich with AI analysis
    let aiAnalysis = null;
    let aisaPayment = null;
    let resultSource = "rule_based";

    if (isAisaConfigured()) {
      try {
        const aisaFetch = getAisaFetch();
        const aisaRes = await aisaFetch(`${AISA_BASE_URL}/perplexity/sonar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "user",
                content: `Analyze this blockchain project for investment potential in 3 sentences. 
                Project: ${project.name}. 
                Ecosystem: ${project.ecosystem || 'unknown'}.
                Description: ${project.description || "N/A"}. 
                GitHub stats: ${JSON.stringify(project.stats || {})}. 
                Score: ${total}/100.
                
                Also provide a brief recommendation on whether they should launch a token on Solana via Bags or stick to Circle-backed credit lines based on their GitHub activity.`,
              },
            ],
          }),
        });

        if (aisaRes.ok) {
          const data = await aisaRes.json();
          aiAnalysis = data.choices?.[0]?.message?.content || null;
          const paymentHeader = aisaRes.headers.get("x-402-receipt");
          aisaPayment = {
            provider: "AIsa x402",
            model: "perplexity/sonar",
            estimatedCost: "~0.012 USDC",
            paymentHeader,
            paymentVerified: !!paymentHeader,
          };
          resultSource = "live_ai";
        }
      } catch (aisaErr) {
        console.error("AIsa enrichment error:", aisaErr.message);
      }
    }

    // 4. Build result
    const result = {
      ...agentIdentityResponse('underwrite'),
      success: true,
      status: "ok",
      resultSource,
      nextAction: "Review the health score and decide whether to back this project.",
      agentInfo: {
        name: identity.domain,
        humanName: identity.displayName,
        feePaid: req.nanopayment.amount,
        txHash: req.nanopayment.txHash,
        network: "arc",
        paymentStatus: req.nanopayment.testMode ? "test_mode" : (req.nanopayment.verificationStatus || "unverified"),
        aisaPayment,
      },
      project: {
        id: project.id,
        name: project.name,
      },
      healthScore: total,
      breakdown,
      recommendation,
      strategicAdvice,
      aiAnalysis,
      timestamp: new Date().toISOString()
    };

    // 4.5 Log underwrite run to agent_runs for audit trail
    try {
      const runId = `underwrite_${Date.now()}`;
      await db.collection("agent_runs").doc(runId).set({
        type: "underwrite",
        timestamp: result.timestamp,
        projectId: project.id,
        project: { id: project.id, name: project.name, ecosystem: project.ecosystem },
        healthScore: total,
        breakdown,
        recommendation: recommendation?.recommendation || "analyze",
        resultSource,
        reasoningTrace: aiAnalysis
          ? [{ project: project.name, trace: aiAnalysis }]
          : [{ project: project.name, trace: `Rule-based score: ${total}/100. ${strategicAdvice?.[0] || "Analyzed project health."}` }],
        strategicAdvice: strategicAdvice || null,
        ecosystemAnalysis: aiAnalysis || null,
      });
    } catch (logErr) {
      console.warn("Failed to log underwrite run:", logErr.message);
    }

    // 5. Cache the result for future requests
    await setCachedResult("underwrite", { projectId }, result);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Underwriter agent error:", error);
    return res.status(500).json({ error: "Underwriter agent failed", details: error.message, status: "error" });
  }
}

// Wrap the handler with auth + nanopayment middleware.
// Protected by optional API key auth (if AGENT_API_KEY is set).
export default withAgentAuth(withNanopayment(handler, 0.05));
