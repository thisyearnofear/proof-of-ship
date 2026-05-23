/**
 * AI Agent — Execute backings via Circle Developer-Controlled Wallets on Arc.
 *
 * POST /api/agent/execute
 * Body: { projects: [{ id, amount, multiplier }] }
 *
 * ⚠️  SECURITY: This endpoint is wrapped with withNanopayment() and withAgentAuth().
 *     On-chain backings are only executed when both payment AND auth are verified.
 *     Previously this endpoint had no payment guard — anyone could trigger
 *     USDC transfers from the agent wallet.
 *
 * Uses Circle's raw REST API directly for contract execution transactions
 * (the SDK v10.3.1 has an axios interceptor bug with contract execution).
 *
 * Requires env vars:
 *   CIRCLE_API_KEY / TEST_CIRCLE_API_KEY     — Circle API key
 *   CIRCLE_ENTITY_SECRET                     — Entity secret
 *   CIRCLE_AGENT_WALLET_ID                   — Agent wallet ID
 *   BUILDER_CREDIT_ARC_ADDRESS               — BuilderCreditCore proxy on Arc Testnet
 *   CIRCLE_AGENT_WALLET_SET_ID (optional)    — Separate wallet set for agent
 */

import { db } from "@/lib/firebase/serverOnly";
import { generateEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
import { withNanopayment } from "@/lib/nanopayment";
import { withAgentAuth } from "@/lib/agentAuth";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

function keccak256(str) {
  const { createHash } = require("crypto");
  return createHash("sha3-256").update(str).digest("hex");
}

function encodeUint256(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function encodeAddress(addr) {
  return addr.toLowerCase().replace("0x", "").padStart(64, "0");
}

function encodeBackCall(projectId, multiplier, amount) {
  const sig = keccak256("backProject(uint256,uint256,uint256)").slice(0, 8);
  return "0x" + sig + encodeUint256(projectId) + encodeUint256(multiplier) + encodeUint256(amount);
}

function encodeApproveCall(spender) {
  const sig = keccak256("approve(address,uint256)").slice(0, 8);
  const max = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  return "0x" + sig + encodeAddress(spender) + max;
}

async function createContractTx(apiKey, ciphertext, walletId, destinationAddress, contractAddress, callData) {
  const { randomUUID } = require("crypto");
  const https = require("https");
  const data = JSON.stringify({
    idempotencyKey: randomUUID(),
    walletId,
    destinationAddress,
    contractAddress,
    callData,
    feeLevel: "MEDIUM",
    entitySecretCiphertext: ciphertext,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.circle.com",
      path: "/v1/w3s/developer/transactions/contractExecution",
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    }, res => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.data?.transaction) resolve(parsed.data.transaction);
          else if (parsed.data?.id) resolve(parsed.data);
          else reject(new Error(parsed.message || "Unknown error"));
        } catch (e) { reject(new Error(body.substring(0, 200))); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const contractAddress = process.env.BUILDER_CREDIT_ARC_ADDRESS;
  const agentWalletId = process.env.CIRCLE_AGENT_WALLET_ID;
  const apiKey = process.env.TEST_CIRCLE_API_KEY || process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!contractAddress || !agentWalletId || !apiKey || !entitySecret) {
    return res.status(500).json({
      error: "Agent not configured",
      missing: [
        !agentWalletId && "CIRCLE_AGENT_WALLET_ID",
        !contractAddress && "BUILDER_CREDIT_ARC_ADDRESS",
        !apiKey && "CIRCLE_API_KEY",
        !entitySecret && "CIRCLE_ENTITY_SECRET",
      ].filter(Boolean),
    });
  }

  const { projects } = req.body || {};
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array required" });
  }

  try {
    // Generate fresh entity secret ciphertext
    let ciphertext;
    try {
      ciphertext = await generateEntitySecretCiphertext({ entitySecret, apiKey });
    } catch (e) {
      return res.status(500).json({ error: "Failed to generate entity secret", details: e.message });
    }

    // Pre-approve BuilderCreditCore to spend agent's USDC
    const approveCalldata = encodeApproveCall(contractAddress);
    await createContractTx(apiKey, ciphertext, agentWalletId, USDC_ADDRESS, USDC_ADDRESS, approveCalldata);

    // Execute backings
    const results = [];
    for (const project of projects) {
      try {
        const calldata = encodeBackCall(project.id, project.multiplier, project.amount);
        const tx = await createContractTx(apiKey, ciphertext, agentWalletId, contractAddress, contractAddress, calldata);
        results.push({
          projectId: project.id,
          amount: project.amount,
          multiplier: project.multiplier,
          txHash: tx?.txHash || tx?.id,
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

    const successful = results.filter(r => r.status === "success");
    const failed = results.filter(r => r.status === "failed");

    const runId = `exec_${Date.now()}`;
    await db.collection("agent_runs").doc(runId).set({
      type: "execution",
      timestamp: new Date().toISOString(),
      agentWalletId,
      chain: "arc-testnet",
      totalBacked: successful.length,
      totalFailed: failed.length,
      totalStaked: successful.reduce((s, r) => s + r.amount, 0),
      transactions: results,
    });

    // Log the nanopayment that funded this execution
    const paymentInfo = req.nanopayment
      ? {
          paymentTxHash: req.nanopayment.txHash,
          paymentAmount: req.nanopayment.amount,
          paymentVerified: req.nanopayment.verified,
          paymentDemo: req.nanopayment.demo,
        }
      : {};

    return res.status(200).json({
      success: true,
      runId,
      agentWalletId,
      circleManaged: true,
      ...paymentInfo,
      summary: {
        backed: successful.length,
        failed: failed.length,
        totalStaked: successful.reduce((s, r) => s + r.amount, 0).toFixed(2) + " USDC",
        txHashes: successful.map(r => r.txHash).filter(Boolean),
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: "Execution failed", details: error.message });
  }
}

// Apply middleware chain: auth → nanopayment → handler
// This ensures both API key auth AND x402 payment are required
// before any on-chain USDC can be moved from the agent wallet.
const wrappedHandler = withAgentAuth(withNanopayment(handler, 0.01));
export default wrappedHandler;
