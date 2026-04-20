/**
 * AI Underwriter Agent — Evaluates a single project and generates a health score.
 * 
 * GET /api/agent/underwrite?projectId=<id>
 * 
 * This endpoint demonstrates the "Per-API Monetization Engine" for the lablab.ai hackathon.
 * It requires a nanopayment of 0.05 USDC to run the AI scoring models.
 */

import { db } from "@/lib/firebase/adminApp";
import { computeScore, getRecommendation } from "@/lib/scoringEngine";
import { withNanopayment } from "@/lib/nanopayment";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId query parameter is required" });
  }

  try {
    // 1. Fetch project data from Firestore
    const docRef = db.collection("projects").doc(projectId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = { id: snapshot.id, ...snapshot.data() };

    // 2. Run the AI Scoring Engine
    const { total, breakdown } = computeScore(project);
    const recommendation = getRecommendation(total);

    // 3. Return the fully computed underwriting report
    return res.status(200).json({
      success: true,
      agentInfo: {
        name: "AI Underwriter",
        feePaid: req.nanopayment.amount,
        txHash: req.nanopayment.txHash,
        network: "arc",
      },
      project: {
        id: project.id,
        name: project.name,
      },
      healthScore: total,
      breakdown,
      recommendation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Underwriter agent error:", error);
    return res.status(500).json({ error: "Underwriter agent failed", details: error.message });
  }
}

// Wrap the handler with the Circle Nanopayment middleware, requiring a 0.05 USDC fee.
export default withNanopayment(handler, 0.05);
