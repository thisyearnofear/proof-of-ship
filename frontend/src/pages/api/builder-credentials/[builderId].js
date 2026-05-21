import { db } from "../../../lib/firebase/serverOnly";

/**
 * Builder Credentials API
 *
 * GET /api/builder-credentials/[builderId] - Get a builder's credential document
 * POST /api/builder-credentials/[builderId] - Recompute and store a builder's credential document
 *
 * Builder credentials aggregate payout attestations into a per-builder summary
 * of hackathon wins, verified payouts, and payout reliability.
 */

export default async function handler(req, res) {
  const { builderId } = req.query;

  if (!builderId || typeof builderId !== 'string') {
    return res.status(400).json({ error: 'Invalid builder ID' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetCredential(req, res, builderId);
    case 'POST':
      return handleRecompute(req, res, builderId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/builder-credentials/[builderId]
 * Returns the builder's credential document, or null if not yet computed.
 */
async function handleGetCredential(req, res, builderId) {
  try {
    const doc = await db.collection('builderCredentials').doc(builderId).get();

    if (!doc.exists) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No credentials yet — builder has no verified payouts'
      });
    }

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error(`Error fetching credential for builder ${builderId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * POST /api/builder-credentials/[builderId]
 * Triggers a recompute of the builder's credential from payout attestations.
 * Used by the PayoutVerifier agent after each new attestation.
 */
async function handleRecompute(req, res, builderId) {
  try {
    const { BuilderCredentialService } = await import('../../../services/BuilderCredentialService');
    const credential = await BuilderCredentialService.computeAndStore(builderId);

    res.status(200).json({
      success: true,
      data: credential,
      message: `Credential recomputed: ${credential.totalHackathonsWon} wins, ${credential.totalPrizesVerified} verified`
    });

  } catch (error) {
    console.error(`Error recomputing credential for builder ${builderId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
