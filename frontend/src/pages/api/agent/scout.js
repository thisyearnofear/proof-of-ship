/**
 * AI Scout Agent — evaluates projects and recommends micro-backings
 *
 * GET  /api/agent/scout           → run scout, return scored projects
 * POST /api/agent/scout?execute=1 → run scout AND execute backings on-chain
 *
 * Nanopayment: 0.01 USDC per scout run (agentic economy)
 * Scoring model:
 *   GitHub velocity (40%) + project completeness (30%) + community signals (30%)
 *   → score 0–100 → multiplier + stake recommendation
 */

import { db } from "@/lib/firebase/serverOnly";
import { withNanopayment } from "@/lib/nanopayment";
import { computeScore, getRecommendation, MIN_SCORE_TO_BACK } from "@/lib/scoringEngine";
import { getAisaFetch, AISA_BASE_URL, isAisaConfigured } from "@/server/aisaClient";
import { getCachedResult, setCachedResult } from "@/lib/agentCache";
import { agentIdentityResponse, getAgentIdentity } from "@/lib/agentIdentity";
import { withAgentAuth } from "@/lib/agentAuth";

async function scoutHandler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const identity = getAgentIdentity('scout');
    // Check cache for GET requests (skip for POST/execute)
    if (req.method === "GET" && req.query.fresh !== "1") {
      const cached = await getCachedResult("scout", { ecosystem: req.query.ecosystem || "all" });
      if (cached) {
        return res.status(200).json({
          ...cached.data,
          status: "ok",
          resultSource: "cached",
          nextAction: "Review the recommended projects and run deeper analysis on the best candidates.",
          cached: true,
          cachedAt: cached.cachedAt,
          cachedAge: cached.ageHuman,
        });
      }
    }

    // Fetch projects from Firestore with pagination and filtering
    const SCOUT_PAGE_LIMIT = 200; // Max projects to evaluate per scout run
    let projects = [];
    try {
      let query = db.collection("projects")
        .orderBy("submittedAt", "desc")
        .limit(SCOUT_PAGE_LIMIT);

      // Optional ecosystem filter
      if (req.query.ecosystem && req.query.ecosystem !== "all") {
        query = query.where("ecosystem", "==", req.query.ecosystem);
      }

      const snapshot = await query.get();
      projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      // If orderBy fails (missing index), fall back to unordered query
      if (err.code === "failed-precondition" || err.message?.includes("index")) {
        try {
          const snapshot = await db.collection("projects")
            .limit(SCOUT_PAGE_LIMIT)
            .get();
          projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        } catch (fallbackErr) {
          console.error("Scout fallback query also failed:", fallbackErr.message);
          return res.status(500).json({
            ...agentIdentityResponse('scout'),
            success: false,
            status: 'error',
            error: 'Failed to fetch projects',
            details: fallbackErr.message,
            projects: [],
            summary: { evaluated: 0, recommended: 0, totalStake: '$0.00' }
          });
        }
      } else {
        console.error("Failed to fetch projects from Firestore:", {
          message: err.message,
          code: err.code,
        });
        return res.status(500).json({
          ...agentIdentityResponse('scout'),
          success: false,
          status: 'error',
          error: 'Failed to fetch projects',
          details: err.message,
          projects: [],
          summary: { evaluated: 0, recommended: 0, totalStake: '$0.00' }
        });
      }
    }

    // Score each project
    let scored = [];
    try {
      scored = projects
        .map((project) => {
          try {
            const { total, breakdown } = computeScore(project);
            const recommendation = getRecommendation(total);
            return {
              id: project.id,
              name: project.name || project.slug || "Unnamed Project",
              ecosystem: project.ecosystem,
              slug: project.slug,
              score: total,
              breakdown,
              recommendation,
              backed: total >= MIN_SCORE_TO_BACK,
            };
          } catch (projectErr) {
            console.warn(`Failed to score project ${project.id}:`, projectErr.message);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
    } catch (scoringErr) {
      console.error("Scoring engine error:", scoringErr.message);
      return res.status(500).json({
        ...agentIdentityResponse('scout'),
        success: false,
        status: 'error',
        error: 'Scoring engine failed',
        details: scoringErr.message,
      });
    }

    const toBack = scored.filter((p) => p.backed);
    const totalStake = toBack.reduce((sum, p) => sum + (p.recommendation?.amount || 0), 0);

    // Log scout run to Firestore (non-fatal if it fails)
    let runId = null;
    try {
      runId = `scout_${Date.now()}`;
      await db.collection("agent_runs").doc(runId).set({
        timestamp: new Date().toISOString(),
        projectsEvaluated: scored.length,
        projectsBacked: toBack.length,
        totalStakeRecommended: totalStake,
        executed: req.method === "POST" && req.query.execute === "1",
        results: toBack.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          amount: p.recommendation?.amount,
          multiplier: p.recommendation?.multiplier,
        })),
      });
    } catch (logErr) {
      console.warn("Failed to log scout run to Firestore:", logErr.message);
    }

    // If POST with execute=1, trigger on-chain backings via Arc
    let executionResult = null;
    const shouldExecute = req.method === "POST" && req.query.execute === "1";

    if (shouldExecute && toBack.length > 0) {
      try {
        const baseUrl = req.headers.host?.includes("localhost")
          ? `http://${req.headers.host}`
          : `https://${req.headers.host}`;

        const execRes = await fetch(`${baseUrl}/api/agent/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projects: toBack.map((p) => ({
              id: p.id,
              amount: p.recommendation.amount,
              multiplier: p.recommendation.multiplier,
            })),
          }),
        });
        executionResult = await execRes.json();
      } catch (err) {
        executionResult = { error: err.message };
      }
    }

    // AIsa-powered ecosystem analysis (optional)
    let ecosystemAnalysis = null;
    let aisaPayment = null;
    let resultSource = req.nanopayment?.demo ? "demo" : "rule_based";
    if (isAisaConfigured()) {
      try {
        const avgScore = scored.length > 0
          ? Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length)
          : 0;
        const topNames = toBack.slice(0, 3).map((p) => `${p.name} (${p.ecosystem || 'unknown'})`).join(", ");
        const prompt = `Summarize the investment landscape for these ${scored.length} blockchain projects in 2 sentences. 
        Top projects: ${topNames}. 
        Overall ecosystem health score: ${avgScore}/100.
        Consider all ecosystems equally — Solana, Arc, Celo, Base, Linea, Arbitrum, Ethereum, and Optimism projects should all be evaluated on their own merits.`;

        const aisaFetch = getAisaFetch();
        const aisaRes = await aisaFetch(`${AISA_BASE_URL}/perplexity/sonar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const aisaData = await aisaRes.json();
        ecosystemAnalysis = aisaData.choices?.[0]?.message?.content || null;
        aisaPayment = { provider: "aisa", model: "perplexity/sonar", status: "paid" };
        resultSource = "live_ai";
      } catch (err) {
        console.warn("AIsa ecosystem analysis failed (non-fatal):", err.message);
      }
    }

    const result = {
      ...agentIdentityResponse('scout'),
      success: true,
      status: "ok",
      resultSource,
      nextAction: shouldExecute
        ? "Review the execution results and confirm which backings succeeded."
        : "Review the recommended projects and run deeper analysis on the best candidates.",
      agentInfo: {
        name: identity.domain,
        humanName: identity.displayName,
        feePaid: req.nanopayment?.amount || 0,
        txHash: req.nanopayment?.txHash,
        network: "arc",
        paymentStatus: req.nanopayment?.demo ? "demo" : (req.nanopayment?.verificationStatus || "unverified"),
        ...(aisaPayment && { aisaPayment }),
      },
      runId,
      summary: {
        evaluated: scored.length,
        recommended: toBack.length,
        totalStake: `$${totalStake.toFixed(2)} USDC`,
        executed: shouldExecute,
      },
      ecosystemAnalysis,
      execution: executionResult,
      projects: scored,
    };

    // Cache GET results
    if (req.method === "GET") {
      await setCachedResult("scout", { ecosystem: req.query.ecosystem || "all" }, result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Scout agent error:", error);
    return res.status(500).json({ error: "Scout agent failed", details: error.message, status: "error" });
  }
}

// AI Scout costs 0.01 USDC per run
// Protected by optional API key auth (if AGENT_API_KEY is set)
export default withAgentAuth(withNanopayment(scoutHandler, 0.01));
