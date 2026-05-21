/**
 * AI Agent — Execute backings via Circle Developer-Controlled Wallets on Arc
 *
 * POST /api/agent/execute
 * Body: { projects: [{ id, amount, multiplier }] }
 *
 * Flow:
 * 1. Looks up the agent wallet by CIRCLE_AGENT_WALLET_ID (managed in Circle Console)
 * 2. Pre-approves USDC spend if needed (one-time via Circle API)
 * 3. Calls backProject() on BuilderCreditCore via Circle-signed contract call
 * 4. Logs results to Firestore
 *
 * Requires env vars:
 *   CIRCLE_API_KEY               — Circle API key (already required for wallets/transfers)
 *   CIRCLE_ENTITY_SECRET         — Entity secret for developer-controlled wallets
 *   CIRCLE_AGENT_WALLET_ID       — Agent wallet ID from Circle Console
 *   BUILDER_CREDIT_ARC_ADDRESS   — Deployed BuilderCreditCore proxy on Arc Testnet
 *
 * Key management: Circle holds the agent's private key. We never see it.
 * Set spending policies in Circle Console: developers.circle.com
 */

import { db } from "@/lib/firebase/serverOnly";
import { realCircleService } from "@/services/RealCircleService";

const ARC_CHAIN_ID = 5042002;
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Minimal ABI encoders for the contract calls we need
const BUILDER_CREDIT_ABI = [
  "function backProject(uint256 projectId, uint256 multiplier, uint256 amount) external",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

// Simple keccak256 + encode helpers — avoids pulling in ethers just for ABI encoding
function keccak256(str) {
  // Node.js crypto-based keccak256
  const { createHash } = require("crypto");
  return createHash("sha3-256").update(str).digest("hex");
}

function encodeUint256(value) {
  const hex = BigInt(value).toString(16).padStart(64, "0");
  return hex;
}

function encodeAddress(addr) {
  return addr.toLowerCase().replace("0x", "").padStart(64, "0");
}

/** ABI-encode a call to backProject(uint256,uint256,uint256) */
function encodeBackCall(projectId, multiplier, amount) {
  const sig = keccak256("backProject(uint256,uint256,uint256)").slice(0, 8);
  return "0x" + sig + encodeUint256(projectId) + encodeUint256(multiplier) + encodeUint256(amount);
}

/** ABI-encode a call to approve(address,uint256) */
function encodeApproveCall(spender, amount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") {
  const sig = keccak256("approve(address,uint256)").slice(0, 8);
  return "0x" + sig + encodeAddress(spender) + amount;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const contractAddress = process.env.BUILDER_CREDIT_ARC_ADDRESS;
  const agentWalletId = process.env.CIRCLE_AGENT_WALLET_ID;

  if (!contractAddress || !agentWalletId) {
    return res.status(500).json({
      error: "Agent not configured",
      missing: [
        !agentWalletId && "CIRCLE_AGENT_WALLET_ID",
        !contractAddress && "BUILDER_CREDIT_ARC_ADDRESS",
      ].filter(Boolean),
    });
  }

  if (!realCircleService.isConfigured()) {
    return res.status(500).json({
      error: "Circle API not configured",
      missing: ["CIRCLE_API_KEY", "CIRCLE_ENTITY_SECRET"].filter(
        (k) => !process.env[k]
      ),
    });
  }

  const { projects } = req.body || {};
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array required" });
  }

  try {
    // Verify agent wallet exists and get its address
    const walletResp = await realCircleService.getWalletById(agentWalletId);
    const agentWallet = walletResp.data.wallet;
    const agentAddress = agentWallet.address;

    const totalAmount = projects.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Pre-approve BuilderCreditCore to spend agent's USDC (one-time)
    // Uses Circle API to create a contract call: USDC.approve(BuilderCreditCore, max)
    const approveCalldata = encodeApproveCall(contractAddress);
    await realCircleService.createTransaction({
      walletId: agentWalletId,
      destinationAddress: USDC_ADDRESS,
      contractAddress: USDC_ADDRESS,
      calldata: approveCalldata,
      feeLevel: "MEDIUM",
    });

    // Execute backings via Circle-signed contract calls
    const results = [];
    for (const project of projects) {
      try {
        const calldata = encodeBackCall(project.id, project.multiplier, project.amount);
        const txResp = await realCircleService.createTransaction({
          walletId: agentWalletId,
          destinationAddress: contractAddress,
          contractAddress: contractAddress,
          calldata: calldata,
          feeLevel: "MEDIUM",
        });

        results.push({
          projectId: project.id,
          amount: project.amount,
          multiplier: project.multiplier,
          txHash: txResp.data.transaction?.txHash || txResp.data.transaction?.id,
          status: "success",
        });
      } catch (err) {
        results.push({
          projectId: project.id,
          amount: project.amount,
          multiplier: project.multiplier,
          error: err.message,
          status: "failed",
        });
      }
    }

    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");

    // Log execution to Firestore
    const runId = `exec_${Date.now()}`;
    await db.collection("agent_runs").doc(runId).set({
      type: "execution",
      timestamp: new Date().toISOString(),
      agentWalletId,
      agentAddress,
      chain: "arc-testnet",
      totalBacked: successful.length,
      totalFailed: failed.length,
      totalStaked: successful.reduce((s, r) => s + r.amount, 0),
      transactions: results,
    });

    return res.status(200).json({
      success: true,
      runId,
      agentAddress,
      agentWalletId,
      circleManaged: true, // Indicates the agent wallet is managed by Circle
      summary: {
        backed: successful.length,
        failed: failed.length,
        totalStaked: successful.reduce((s, r) => s + r.amount, 0).toFixed(2) + " USDC",
        txHashes: successful.map((r) => r.txHash).filter(Boolean),
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: "Execution failed", details: error.message });
  }
}
