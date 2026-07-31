/**
 * PayoutVerifier Agent API
 *
 * POST /api/agent/payout-verify
 *
 * Verifies that USDC payouts to hackathon winners actually happened
 * by checking Circle API, EVM on-chain transactions, or Solana token transfers.
 * Records attestations in Firestore and can update project hackathon claims.
 *
 * Body:
 * {
 *   type: 'verify' | 'attest' | 'batch-verify',
 *   projectSlug: string,
 *   hackathonClaimIndex: number,        // index in project.hackathons[] to update
 *   winnerAddress: string,              // recipient wallet address
 *   expectedAmount: number,             // USDC amount expected
 *   payoutTxHash?: string,              // EVM or Solana tx hash
 *   circleTransferId?: string,          // Circle API transfer ID
 *   chainId?: string | number,          // EVM chain ID or 'sol-devnet'/'sol'
 *   hackathonName?: string,             // override claim name
 * }
 *
 * Batch verify body:
 * {
 *   type: 'batch-verify',
 *   projectSlug: string,
 *   claims: [{
 *     hackathonClaimIndex: number,
 *     winnerAddress: string,
 *     expectedAmount: number,
 *     payoutTxHash?: string,
 *     circleTransferId?: string,
 *     chainId?: string | number,
 *   }]
 * }
 */

import { logActivity } from '../../../utils/activityLogger';
import { payoutVerifierService } from '../../../services/PayoutVerifierService';
import { withAgentAuth } from '../../../lib/agentAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, projectSlug, hackathonClaimIndex, winnerAddress, expectedAmount, payoutTxHash, circleTransferId, chainId, hackathonName, claims } = req.body;

    // ── Batch verify ──────────────────────────────────────────────
    if (type === 'batch-verify') {
      if (!projectSlug || !Array.isArray(claims) || claims.length === 0) {
        return res.status(400).json({ error: 'projectSlug and claims[] are required for batch verify' });
      }

      const results = [];
      for (const claim of claims) {
        const result = await payoutVerifierService.verify({
          hackathonName: claim.hackathonName || `Claim #${claim.hackathonClaimIndex + 1}`,
          winnerAddress: claim.winnerAddress,
          expectedAmount: claim.expectedAmount,
          payoutTxHash: claim.payoutTxHash,
          circleTransferId: claim.circleTransferId,
          chainId: claim.chainId,
        });

        // Update project hackathon claim
        if (projectSlug && claim.hackathonClaimIndex !== undefined) {
          await updateHackathonClaim(projectSlug, claim.hackathonClaimIndex, result);
        }

        results.push({
          hackathonClaimIndex: claim.hackathonClaimIndex,
          ...result,
        });
      }

      return res.status(200).json({
        success: true,
        type: 'batch-verify',
        projectSlug,
        results,
        total: results.length,
        verified: results.filter((r) => r.result.verified).length,
        failed: results.filter((r) => !r.result.verified).length,
      });
    }

    // ── Single verify ─────────────────────────────────────────────
    if (!winnerAddress || !expectedAmount) {
      return res.status(400).json({
        error: 'winnerAddress and expectedAmount are required',
      });
    }

    if (!payoutTxHash && !circleTransferId) {
      return res.status(400).json({
        error: 'Either payoutTxHash or circleTransferId is required',
      });
    }

    const claimName = hackathonName || (projectSlug ? `Project ${projectSlug} claim` : 'Unnamed claim');

    const { result, attestationId } = await payoutVerifierService.verify({
      hackathonName: claimName,
      winnerAddress,
      expectedAmount,
      payoutTxHash,
      circleTransferId,
      chainId,
    });

    // Update project hackathon claim if index provided
    if (projectSlug && hackathonClaimIndex !== undefined) {
      await updateHackathonClaim(projectSlug, hackathonClaimIndex, { result, attestationId });
    }

    // Log activity
    await logActivity({
      type: result.verified ? 'payout_verified' : 'payout_verification_failed',
      projectSlug: projectSlug || claimName,
      userHandle: 'payout-verifier-agent',
      description: result.verified
        ? `Payout verified: ${result.actualAmount} USDC to ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)} via ${result.provider}`
        : `Payout verification failed: ${result.details}`,
      metadata: {
        winnerAddress,
        expectedAmount,
        actualAmount: result.actualAmount,
        provider: result.provider,
        attestationId,
        confidence: result.confidence,
      },
    });

    return res.status(200).json({
      success: true,
      type: 'verify',
      projectSlug,
      verification: result,
      attestationId,
    });
  } catch (err) {
    console.error('PayoutVerifier agent error:', err);
    return res.status(500).json({
      success: false,
      error: 'Payout verification failed',
      details: err.message,
    });
  }
}

export default withAgentAuth(handler);

/**
 * Update a project's hackathon claim in Firestore with verification status.
 * Uses a Firestore transaction to ensure atomicity across attestation + project update.
 */
async function updateHackathonClaim(projectSlug, claimIndex, { result, attestationId }) {
  try {
    const { db } = await import('@/lib/firebase/serverOnly');
    const projectRef = db.collection('projects').doc(projectSlug);

    await db.runTransaction(async (transaction) => {
      const projectSnap = await transaction.get(projectRef);
      if (!projectSnap.exists) return;

      const project = projectSnap.data();
      const hackathons = Array.isArray(project.hackathons) ? [...project.hackathons] : [];

      if (claimIndex < 0 || claimIndex >= hackathons.length) return;

      // Update the claim with verification results
      hackathons[claimIndex] = {
        ...hackathons[claimIndex],
        payoutVerified: result.verified,
        payoutConfidence: result.confidence,
        payoutAttestationId: attestationId,
        payoutActualAmount: result.actualAmount,
        payoutVerifiedAt: new Date().toISOString(),
        payoutProvider: result.provider,
        payoutAt: result.payoutTimestamp || hackathons[claimIndex].payoutAt,
      };

      transaction.update(projectRef, {
        hackathons,
        updatedAt: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.warn('Failed to update hackathon claim:', err);
  }
}
