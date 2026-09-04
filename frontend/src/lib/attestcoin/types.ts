/**
 * Attestcoin types for cross-chain milestone and credit attestation.
 */

export interface MilestoneAttestation {
  /** Unique attestation identifier (will come from the Attestcoin/Creditcoin contract in production). */
  attestationUid: string;
  /** PledgeBond project identifier. */
  projectId: string;
  /** Milestone index within the project. */
  milestoneIndex: number;
  /** Attestation status. */
  status: "verified" | "pending" | "rejected";
  /** ISO timestamp of attestation. */
  timestamp: string;
  /** Source chain where the milestone was completed (e.g., 'solana', 'arc', 'sepolia'). */
  sourceChain?: string;
  /** Extra context (PR id, transaction hash, etc.). */
  metadata?: Record<string, unknown>;
}

export interface AttestcoinClient {
  /**
   * Write an Attestcoin attestation for a milestone.
   * In production this submits a cross-chain proof to the PledgeBond ASC on Creditcoin.
   */
  attestMilestone(
    projectId: string,
    milestoneIndex: number,
    metadata: Record<string, unknown>
  ): Promise<MilestoneAttestation>;

  /**
   * Read Attestcoin attestations for a project milestone.
   * In production this queries the PledgeBond business-logic contract on Creditcoin.
   */
  getMilestoneAttestations(
    projectId: string,
    milestoneIndex: number
  ): Promise<MilestoneAttestation[]>;
}
