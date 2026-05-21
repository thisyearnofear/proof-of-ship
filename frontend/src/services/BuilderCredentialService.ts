/**
 * BuilderCredentialService
 *
 * Aggregates payout attestations into per-builder credentials.
 * Each builder gets a summary of their hackathon wins, verified payouts,
 * and payout reliability metrics.
 *
 * Written to by the PayoutVerifier agent after each attestation.
 * Read by the project detail page and leaderboard for credential display.
 */

import { db } from '../lib/firebase/serverOnly';
import type { PayoutAttestation } from './PayoutVerifierService';

// ── Types ──────────────────────────────────────────────────────────

export interface HackathonWin {
  hackathonName: string;
  projectSlug: string;
  outcome: string;               // "won", "finalist", "runner-up", etc.
  prizeAmount: number;
  declaredAt: string | null;     // ISO date
  paidAt: string | null;         // ISO date
  payoutLatencyDays: number | null;
  verified: boolean;
  confidence: 'high' | 'medium' | 'low';
  attestationId: string | null;
}

export interface BuilderCredential {
  builderId: string;
  totalHackathonsWon: number;
  totalPrizesVerified: number;
  totalPrizeAmount: number;
  avgPayoutLatencyDays: number | null;
  payoutCompletionRate: number;  // 0-100
  lastPayoutAt: string | null;
  hackathonWins: HackathonWin[];
  updatedAt: string;
}

// ── Service ─────────────────────────────────────────────────────────

export class BuilderCredentialService {
  private readonly collection = 'builderCredentials';

  /**
   * Compute and store a builder's credential document by aggregating
   * all payout attestations for projects owned by that builder.
   */
  async computeAndStore(builderId: string): Promise<BuilderCredential> {
    const attestations = await this.fetchAttestationsForBuilder(builderId);
    const credential = this.computeCredential(builderId, attestations);

    await db.collection(this.collection).doc(builderId).set(credential);

    return credential;
  }

  /**
   * Fetch a builder's credential document.
   */
  async get(builderId: string): Promise<BuilderCredential | null> {
    const doc = await db.collection(this.collection).doc(builderId).get();
    if (!doc.exists) return null;
    return doc.data() as BuilderCredential;
  }

  /**
   * Fetch all payout attestations for projects owned by a builder.
   * Looks up the builder's projects, then collects attestations for those projects.
   */
  private async fetchAttestationsForBuilder(builderId: string): Promise<PayoutAttestation[]> {
    // Find all projects owned by this builder
    const ecosystems = ['projects', 'projects_celo', 'projects_base', 'projects_solana', 'projects_arc', 'projects_linea'];
    const projectSlugs: string[] = [];

    for (const ecosystem of ecosystems) {
      const snapshot = await db.collection(ecosystem)
        .where('owners', 'array-contains', builderId)
        .select('slug')
        .get();

      snapshot.forEach(doc => {
        const slug = doc.data().slug || doc.id;
        if (!projectSlugs.includes(slug)) {
          projectSlugs.push(slug);
        }
      });
    }

    if (projectSlugs.length === 0) return [];

    // Batch fetch attestations for all project slugs
    const attestations: PayoutAttestation[] = [];
    const CHUNK_SIZE = 10;

    for (let i = 0; i < projectSlugs.length; i += CHUNK_SIZE) {
      const chunk = projectSlugs.slice(i, i + CHUNK_SIZE);
      const snapshot = await db.collection('payoutAttestations')
        .where('projectSlug', 'in', chunk)
        .orderBy('createdAt', 'desc')
        .get();

      snapshot.forEach(doc => {
        attestations.push({ id: doc.id, ...doc.data() } as PayoutAttestation);
      });
    }

    return attestations;
  }

  /**
   * Compute the builder credential from raw attestations.
   */
  private computeCredential(builderId: string, attestations: PayoutAttestation[]): BuilderCredential {
    const wins: HackathonWin[] = attestations.map(a => {
      const declaredAt = null; // Not stored in attestation directly — would need to cross-reference projects.hackathons[].declaredAt
      const paidAt = a.verification.payoutTimestamp;
      const latencyDays = declaredAt && paidAt
        ? Math.round((new Date(paidAt).getTime() - new Date(declaredAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        hackathonName: a.hackathonName,
        projectSlug: a.projectSlug,
        outcome: 'won',
        prizeAmount: a.expectedAmount,
        declaredAt,
        paidAt,
        payoutLatencyDays: latencyDays,
        verified: a.verification.verified,
        confidence: a.verification.confidence,
        attestationId: a.id || null,
      };
    });

    const totalHackathonsWon = wins.length;
    const totalPrizesVerified = wins.filter(w => w.verified).length;
    const totalPrizeAmount = wins.reduce((sum, w) => sum + w.prizeAmount, 0);

    const latencies = wins
      .filter(w => w.payoutLatencyDays !== null)
      .map(w => w.payoutLatencyDays as number);

    const avgPayoutLatencyDays = latencies.length > 0
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
      : null;

    const paidCount = wins.filter(w => w.paidAt !== null).length;
    const payoutCompletionRate = totalHackathonsWon > 0
      ? Math.round((paidCount / totalHackathonsWon) * 100)
      : 0;

    const paidDates = wins
      .filter(w => w.paidAt !== null)
      .map(w => w.paidAt as string)
      .sort()
      .reverse();

    return {
      builderId,
      totalHackathonsWon,
      totalPrizesVerified,
      totalPrizeAmount,
      avgPayoutLatencyDays,
      payoutCompletionRate,
      lastPayoutAt: paidDates[0] || null,
      hackathonWins: wins,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const builderCredentialService = new BuilderCredentialService();
