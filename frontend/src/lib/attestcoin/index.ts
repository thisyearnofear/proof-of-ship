import { AttestcoinClient, MilestoneAttestation } from "./types";

/**
 * Deterministic mock client for local development and hackathon demos.
 * Returns stable UIDs so the Underwriter can read what the Verifier "wrote".
 */
export class MockAttestcoinClient implements AttestcoinClient {
  private counter = 0;

  async attestMilestone(
    projectId: string,
    milestoneIndex: number,
    metadata: Record<string, unknown>
  ): Promise<MilestoneAttestation> {
    this.counter += 1;
    const attestationUid = `mock-atc-${projectId}-${milestoneIndex}-${this.counter}`;
    return {
      attestationUid,
      projectId,
      milestoneIndex,
      status: "verified",
      timestamp: new Date().toISOString(),
      sourceChain: (metadata?.sourceChain as string) || "mock",
      metadata,
    };
  }

  async getMilestoneAttestations(
    projectId: string,
    milestoneIndex: number
  ): Promise<MilestoneAttestation[]> {
    return [
      {
        attestationUid: `mock-atc-${projectId}-${milestoneIndex}-1`,
        projectId,
        milestoneIndex,
        status: "verified",
        timestamp: new Date().toISOString(),
        sourceChain: "mock",
      },
    ];
  }
}

/**
 * Real Attestcoin client using the Gluwa USC SDK and the PledgeBond ASC on Creditcoin.
 *
 * This is a scaffold. To activate:
 *   1. Deploy PledgeBondAttestcoin.sol to Creditcoin testnet.
 *   2. Set ATTESTCOIN_CONTRACT_ADDRESS and ATTESTCOIN_* RPC/env values.
 *   3. Install @gluwa/usc-sdk in the frontend workspace.
 */
export class UscAttestcoinClient implements AttestcoinClient {
  async attestMilestone(
    projectId: string,
    milestoneIndex: number,
    _metadata: Record<string, unknown>
  ): Promise<MilestoneAttestation> {
    throw new Error(
      `UscAttestcoinClient not yet configured. ` +
      `Deploy the ASC contract and set ATTESTCOIN_CONTRACT_ADDRESS. ` +
      `Project: ${projectId}, milestone: ${milestoneIndex}`
    );
  }

  async getMilestoneAttestations(
    projectId: string,
    milestoneIndex: number
  ): Promise<MilestoneAttestation[]> {
    throw new Error(
      `UscAttestcoinClient not yet configured. ` +
      `Deploy the ASC contract and set ATTESTCOIN_CONTRACT_ADDRESS. ` +
      `Project: ${projectId}, milestone: ${milestoneIndex}`
    );
  }
}

let client: AttestcoinClient | null = null;

export function getAttestcoinClient(): AttestcoinClient {
  if (client) return client;

  const enabled = process.env.ATTESTCOIN_ENABLED === "true";
  client = enabled ? new UscAttestcoinClient() : new MockAttestcoinClient();
  return client;
}

export function resetAttestcoinClient(forced?: AttestcoinClient): void {
  client = forced || null;
}

export * from "./types";
