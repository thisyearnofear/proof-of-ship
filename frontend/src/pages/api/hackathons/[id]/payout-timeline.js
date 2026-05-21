import { db } from "../../../../lib/firebase/serverOnly";

/**
 * Payout Timeline API
 *
 * GET /api/hackathons/[id]/payout-timeline
 *
 * Aggregates payout claims across all projects that match this hackathon,
 * cross-references with payoutAttestations, and returns a structured timeline
 * of declared → paid → verified for each winning project.
 *
 * Response shape:
 * {
 *   hackathonName: string,
 *   totalWinners: number,
 *   paidWinners: number,
 *   totalPrizeAmount: number,
 *   avgPayoutDays: number | null,
 *   payoutCompletionRate: number,
 *   timeline: [{
 *     projectSlug: string,
 *     projectName: string,
 *     winnerAddress: string,
 *     prizeAmount: number,
 *     claimOutcome: string,
 *     declaredAt: string | null,     // from project.hackathons[].hackathonEndDate (proxy for declaration time)
 *     paidAt: string | null,         // from project.hackathons[].payoutAt or .payoutVerifiedAt
 *     payoutLatencyDays: number | null,
 *     verified: boolean,
 *     confidence: 'high' | 'medium' | 'low',
 *     payoutTxHash: string | null,
 *     attestationId: string | null,
 *   }]
 * }
 */

const ECOSYSTEM_COLLECTIONS = [
  'projects',
];

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid hackathon ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get the hackathon document to know its name
    const hackathonDoc = await db.collection('hackathons').doc(id).get();

    if (!hackathonDoc.exists) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const hackathonData = hackathonDoc.data();
    const hackathonName = hackathonData.name;

    // 2. Search all project collections for matching hackathon claims
    const claims = [];

    for (const collection of ECOSYSTEM_COLLECTIONS) {
      const snapshot = await db.collection(collection)
        .where('hackathons', '!=', null)
        .select('name', 'slug', 'title', 'hackathons', 'owners')
        .get();

      snapshot.forEach(doc => {
        const project = doc.data();
        const projectHackathons = Array.isArray(project.hackathons) ? project.hackathons : [];

        projectHackathons.forEach(claim => {
          if (!claim.name) return;

          // Match by case-insensitive name
          if (claim.name.trim().toLowerCase() !== hackathonName.trim().toLowerCase()) return;

          // Only include winner/finalist outcomes
          if (claim.outcome !== 'winner' && claim.outcome !== 'finalist') return;

          claims.push({
            projectSlug: project.slug || doc.id,
            projectName: project.title || project.name || doc.id,
            winnerAddress: claim.winnerAddress || null,
            prizeAmount: claim.payoutAmount || claim.prizeAmount || 0,
            claimOutcome: claim.outcome,
            hackathonEndDate: claim.hackathonEndDate || null,
            payoutAt: claim.payoutAt || null,
            payoutVerifiedAt: claim.payoutVerifiedAt || null,
            payoutTxHash: claim.payoutTxHash || null,
            payoutActualAmount: claim.payoutActualAmount || null,
            payoutConfidence: claim.payoutConfidence || null,
            payoutAttestationId: claim.payoutAttestationId || null,
          });
        });
      });
    }

    // 3. Cross-reference with payoutAttestations for verified attestation data
    const attestationIds = claims
      .map(c => c.payoutAttestationId)
      .filter(Boolean);

    if (attestationIds.length > 0) {
      const attestationSnapshot = await db.collection('payoutAttestations')
        .where('__name__', 'in', attestationIds)
        .get();

      const attestationMap = {};
      attestationSnapshot.forEach(doc => {
        attestationMap[doc.id] = doc.data();
      });

      // Enrich claims with full attestation data
      claims.forEach(claim => {
        if (claim.payoutAttestationId && attestationMap[claim.payoutAttestationId]) {
          const att = attestationMap[claim.payoutAttestationId];
          claim.attestation = att;
        }
      });
    }

    // 4. Build the timeline entries
    const timeline = claims.map(claim => {
      // Prefer agent-set payoutVerifiedAt over user-entered payoutAt
      const paidAt = claim.payoutVerifiedAt || claim.payoutAt || null;

      // Compute latency from hackathon end date (proxy for declaration time)
      const declaredAt = claim.hackathonEndDate || null;
      let payoutLatencyDays = null;

      if (declaredAt && paidAt) {
        const diffMs = new Date(paidAt).getTime() - new Date(declaredAt).getTime();
        if (diffMs >= 0) {
          payoutLatencyDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      const verified = claim.attestation?.verification?.verified === true
        || claim.payoutConfidence >= 90;

      const confidence = claim.attestation?.verification?.confidence
        || (claim.payoutConfidence >= 90 ? 'high' : claim.payoutConfidence >= 50 ? 'medium' : 'low');

      return {
        projectSlug: claim.projectSlug,
        projectName: claim.projectName,
        winnerAddress: claim.winnerAddress,
        prizeAmount: claim.prizeAmount,
        claimOutcome: claim.claimOutcome,
        declaredAt,
        paidAt,
        payoutLatencyDays,
        verified,
        confidence,
        payoutTxHash: claim.payoutTxHash || claim.attestation?.verification?.payoutTxHash || null,
        attestationId: claim.payoutAttestationId || null,
      };
    });

    // Sort by payout status first (paid before unpaid), then by latency (fastest first)
    timeline.sort((a, b) => {
      if (a.paidAt && !b.paidAt) return -1;
      if (!a.paidAt && b.paidAt) return 1;
      if (a.payoutLatencyDays !== null && b.payoutLatencyDays !== null) {
        return a.payoutLatencyDays - b.payoutLatencyDays;
      }
      return 0;
    });

    // 5. Compute aggregate metrics
    const totalWinners = timeline.length;
    const paidWinners = timeline.filter(t => t.paidAt !== null).length;
    const totalPrizeAmount = timeline.reduce((sum, t) => sum + t.prizeAmount, 0);

    const latencies = timeline
      .filter(t => t.payoutLatencyDays !== null)
      .map(t => t.payoutLatencyDays);

    const avgPayoutDays = latencies.length > 0
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
      : null;

    const payoutCompletionRate = totalWinners > 0
      ? Math.round((paidWinners / totalWinners) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        hackathonName,
        totalWinners,
        paidWinners,
        totalPrizeAmount,
        avgPayoutDays,
        payoutCompletionRate,
        timeline,
      },
    });

  } catch (error) {
    console.error(`Error fetching payout timeline for hackathon ${id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
