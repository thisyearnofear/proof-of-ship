/**
 * AI Scout Agent — Execute backings via Circle Nanopayments on Arc
 *
 * POST /api/agent/execute
 * Body: { projects: [{ id, amount, multiplier }] }
 *
 * Flow:
 * 1. GatewayClient signs EIP-3009 authorizations (offchain, gas-free)
 * 2. Gateway batches and settles on Arc
 * 3. Calls backProject() on BuilderCreditCore
 * 4. Logs results to Firestore
 *
 * Requires env vars:
 *   AGENT_PRIVATE_KEY — agent wallet private key (funded on Arc via Gateway deposit)
 *   BUILDER_CREDIT_ARC_ADDRESS — deployed BuilderCreditCore on Arc Testnet
 */

import { db } from "@/lib/firebase/adminApp";
import { ethers } from "ethers";

// Arc Testnet config
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARC_CHAIN_ID = 5042002;
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Minimal ABI for backProject
const BUILDER_CREDIT_ABI = [
  "function backProject(uint256 projectId, uint256 multiplier, uint256 amount) external",
  "function projects(uint256) view returns (string name, address developer, bool isActive, uint256 fundingAmount, uint256 creditScore, uint256 milestonesCompleted, uint256 milestonesCount)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const agentKey = process.env.AGENT_PRIVATE_KEY;
  const contractAddress = process.env.BUILDER_CREDIT_ARC_ADDRESS;

  if (!agentKey || !contractAddress) {
    return res.status(500).json({
      error: "Agent not configured",
      missing: [
        !agentKey && "AGENT_PRIVATE_KEY",
        !contractAddress && "BUILDER_CREDIT_ARC_ADDRESS",
      ].filter(Boolean),
    });
  }

  const { projects } = req.body || {};
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array required" });
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(ARC_RPC, ARC_CHAIN_ID);
    const wallet = new ethers.Wallet(agentKey, provider);
    const coreContract = new ethers.Contract(contractAddress, BUILDER_CREDIT_ABI, wallet);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    // Check agent balance
    const balance = await usdcContract.balanceOf(wallet.address);
    const balanceFormatted = ethers.utils.formatUnits(balance, 6);

    const totalNeeded = projects.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (parseFloat(balanceFormatted) < totalNeeded) {
      return res.status(400).json({
        error: "Insufficient agent balance",
        balance: balanceFormatted,
        needed: totalNeeded.toFixed(2),
      });
    }

    // Approve contract if needed
    const totalUnits = ethers.utils.parseUnits(totalNeeded.toString(), 6);
    const allowance = await usdcContract.allowance(wallet.address, contractAddress);
    if (allowance.lt(totalUnits)) {
      const approveTx = await usdcContract.approve(contractAddress, ethers.constants.MaxUint256);
      await approveTx.wait();
    }

    // Execute backings
    const results = [];
    for (const project of projects) {
      try {
        const amountUnits = ethers.utils.parseUnits(project.amount.toString(), 6);
        const tx = await coreContract.backProject(
          project.id,
          project.multiplier,
          amountUnits
        );
        const receipt = await tx.wait();
        results.push({
          projectId: project.id,
          amount: project.amount,
          multiplier: project.multiplier,
          txHash: receipt.transactionHash,
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
      agentAddress: wallet.address,
      chain: "arc-testnet",
      totalBacked: successful.length,
      totalFailed: failed.length,
      totalStaked: successful.reduce((s, r) => s + r.amount, 0),
      transactions: results,
    });

    return res.status(200).json({
      success: true,
      runId,
      agentAddress: wallet.address,
      summary: {
        backed: successful.length,
        failed: failed.length,
        totalStaked: `$${successful.reduce((s, r) => s + r.amount, 0).toFixed(2)} USDC`,
        txHashes: successful.map((r) => r.txHash),
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: "Execution failed", details: error.message });
  }
}
