/**
 * AI Agent — Execute backings via Circle Developer-Controlled Wallets on Arc.
 */

import { db } from "@/lib/firebase/serverOnly";
import { withNanopayment } from "@/lib/nanopayment";
import { withAgentAuth } from "@/lib/agentAuth";
import { realCircleService } from "../../../services/RealCircleService";
import { TESTNET_USDC_ADDRESSES, ARC_TESTNET_CHAIN_ID } from "../../../config/tokens";

const USDC_ADDRESS = (TESTNET_USDC_ADDRESSES || {})[ARC_TESTNET_CHAIN_ID] || "0x3600000000000000000000000000000000000000";

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

async function submitContractTx({ walletId, destinationAddress, contractAddress, calldata, idempotencyKey }) {
  const result = await realCircleService.createTransaction({
    walletId,
    destinationAddress,
    contractAddress,
    calldata,
    feeLevel: "MEDIUM",
    idempotencyKey,
  });

  return result.data?.transaction || result.data;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const contractAddress = process.env.BUILDER_CREDIT_ARC_ADDRESS;
  const agentWalletId = process.env.CIRCLE_AGENT_WALLET_ID;

  if (!contractAddress || !agentWalletId || !realCircleService.isClientConfigured()) {
    return res.status(500).json({
      error: "Agent not configured",
      missing: [
        !agentWalletId && "CIRCLE_AGENT_WALLET_ID",
        !contractAddress && "BUILDER_CREDIT_ARC_ADDRESS",
        !realCircleService.isClientConfigured() && "CIRCLE_API_KEY/CIRCLE_ENTITY_SECRET",
      ].filter(Boolean),
    });
  }

  const { projects } = req.body || {};
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array required" });
  }

  try {
    const approveCalldata = encodeApproveCall(contractAddress);
    await submitContractTx({
      walletId: agentWalletId,
      destinationAddress: USDC_ADDRESS,
      contractAddress: USDC_ADDRESS,
      calldata: approveCalldata,
      idempotencyKey: `agent-approve-${agentWalletId}-${contractAddress.toLowerCase()}`,
    });

    const results = [];
    for (const project of projects) {
      try {
        const calldata = encodeBackCall(project.id, project.multiplier, project.amount);
        const tx = await submitContractTx({
          walletId: agentWalletId,
          destinationAddress: contractAddress,
          contractAddress,
          calldata,
          idempotencyKey: `agent-back-${agentWalletId}-${project.id}-${project.multiplier}-${project.amount}`,
        });

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

    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");
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

    const paymentInfo = req.nanopayment
      ? {
          paymentTxHash: req.nanopayment.txHash,
          paymentAmount: req.nanopayment.amount,
          paymentVerified: req.nanopayment.verified,
          paymentTestMode: req.nanopayment.testMode,
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
        txHashes: successful.map((r) => r.txHash).filter(Boolean),
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: "Execution failed", details: error.message });
  }
}

const wrappedHandler = withAgentAuth(withNanopayment(handler, 0.01));
export default wrappedHandler;
