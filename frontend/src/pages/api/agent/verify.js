/**
 * AI Verification Agent — Automatically reviews and verifies PR code.
 * 
 * GET /api/agent/verify?prId=<id>&lines=<count>
 * 
 * This endpoint demonstrates machine-to-machine (M2M) micro-transactions.
 * It charges a variable fee (e.g., 0.01 USDC for 100 lines of code) to 
 * instantly verify milestone submissions.
 */

import { withNanopayment } from "@/lib/nanopayment";
import { getAisaFetch, AISA_BASE_URL, isAisaConfigured } from "@/server/aisaClient";
import { getCachedResult, setCachedResult } from "@/lib/agentCache";
import { agentIdentityResponse, getAgentIdentity } from "@/lib/agentIdentity";
import { withAgentAuth } from "@/lib/agentAuth";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from "bs58";
import IDL from "@/idl/blockchain_solana.json";

const DEFAULT_DEVNET_USDC = "4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX";
const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_PROGRAM_ID ||
    process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ||
    IDL.address
);

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { 
    prId, 
    lines = 100, 
    fresh, 
    network, 
    projectPda, 
    developerTokenAccount, 
    milestoneIndex 
  } = req.query;

  if (!prId) {
    return res.status(400).json({ error: "prId query parameter is required" });
  }

  try {
    const identity = getAgentIdentity('verify');
    if (fresh !== "1") {
      const cached = await getCachedResult("verify", { prId });
      if (cached) {
        return res.status(200).json({
          ...cached.data,
          status: cached.status || "ok",
          resultSource: cached.resultSource || "cached",
          nextAction: cached.nextAction || "Review the verification summary before releasing any milestone funds.",
          cached: true,
          cachedAt: cached.cachedAt,
          cachedAge: cached.ageHuman,
        });
      }
    }

    let verification;
    let aisaPayment = null;
    let resultSource = req.nanopayment?.demo ? "demo" : "fallback";
    let status = "fallback";

    if (isAisaConfigured()) {
      try {
        const aisaFetch = getAisaFetch();
        const aiResponse = await aisaFetch(`${AISA_BASE_URL}/perplexity/sonar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [{
              role: "user",
              content: `Analyze GitHub pull request #${prId}. Check code quality, test coverage, and security. 
              Respond ONLY with JSON: {"approved": boolean, "confidence": number between 0 and 1, "summary": "one sentence", "issues": number}.
              Note: If this is a Solana/Rust project, evaluate Anchor framework usage and Rust safety. If EVM, evaluate Solidity security.`
            }],
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (parsed && typeof parsed.approved === "boolean") {
          verification = {
            prId,
            linesAnalyzed: lines,
            approved: parsed.approved,
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
            summary: parsed.summary || "AI analysis complete.",
            issuesFound: parsed.issues || 0,
          };
          aisaPayment = { provider: "aisa-x402", model: "perplexity-sonar" };
          resultSource = "live_ai";
          status = "ok";
        }
      } catch (aisaErr) {
        console.warn("AIsa verification failed, returning explicit fallback state:", aisaErr.message);
      }
    }

    if (!verification) {
      verification = {
        prId,
        linesAnalyzed: lines,
        approved: null,
        confidence: 0,
        summary: "Automated verification is currently unavailable. No approval decision was made.",
        issuesFound: null,
      };
    }

    // IMPORTANT: The verifier agent ONLY returns an approval decision.
    // On-chain execution (verify_milestone) is NOT performed here.
    // This prevents automatic USDC movement from the agent wallet without
    // explicit user confirmation. To execute on-chain, use a separate
    // dedicated endpoint with its own payment + auth guards.
    //
    // The on-chain data is included in the response so the caller can
    // independently verify the project state and decide whether to proceed.
    let onChainContext = null;
    if (network === "solana" && projectPda) {
      onChainContext = {
        projectPda,
        milestoneIndex: milestoneIndex || "0",
        network: "solana",
        note: "On-chain execution requires a separate authenticated request. This is only a preview of what would be verified.",
      };

      // Optionally fetch on-chain project state for informational purposes
      // (read-only — no transaction is submitted)
      if (process.env.SOLANA_RPC_URL) {
        try {
          const connection = new Connection(
            process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
            "confirmed"
          );
          const projectPubkey = new PublicKey(projectPda);
          const idlWithAddress = { ...IDL, address: PROGRAM_ID.toBase58() };
          const dummyWallet = new anchor.Wallet(
            Keypair.generate()
          );
          const provider = new anchor.AnchorProvider(connection, dummyWallet, {
            preflightCommitment: "confirmed",
          });
          const program = new Program(idlWithAddress, provider);
          const projectAcct = await program.account.project.fetch(projectPubkey);

          onChainContext = {
            ...onChainContext,
            developer: projectAcct.developer.toBase58(),
            milestonesCompleted: projectAcct.milestonesCompleted,
            milestonesCount: projectAcct.milestonesCount,
            isActive: projectAcct.isActive,
            onChainDataFetched: true,
          };
        } catch (fetchErr) {
          console.warn("Could not fetch on-chain project state (non-fatal):", fetchErr.message);
          onChainContext.onChainDataFetched = false;
        }
      }
    }

    const result = {
      ...agentIdentityResponse('verify'),
      success: status === "ok",
      status,
      resultSource,
      nextAction: verification.approved === true
        ? "Review the verification summary before releasing any milestone funds."
        : "Review the verification summary and retry later if you need an automated approval decision.",
      agentInfo: {
        name: identity.domain,
        humanName: identity.displayName,
        feePaid: req.nanopayment.amount,
        txHash: req.nanopayment.txHash,
        network: network || "arc",
        paymentStatus: req.nanopayment.demo ? "demo" : (req.nanopayment.verificationStatus || "unverified"),
        ...(aisaPayment && { aisaPayment }),
      },
      verification,
      onChainContext,
      timestamp: new Date().toISOString(),
    };

    await setCachedResult("verify", { prId }, result);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Verification agent error:", error);
    return res.status(500).json({ error: "Verification agent failed", details: error.message, status: "error" });
  }
}

// For the hackathon, we assume a standard 100 lines PR costing 0.01 USDC
// Protected by optional API key auth (if AGENT_API_KEY is set)
export default withAgentAuth(withNanopayment(handler, 0.01));
