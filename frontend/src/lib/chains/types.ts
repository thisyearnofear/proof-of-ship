/**
 * Shared chain-primitive types.
 *
 * Single source of truth for shapes that creditService (EVM) and
 * SolanaCreditService (Solana) both need to agree on. Both services
 * import from here and no longer redeclare these interfaces in parallel.
 *
 * Receipt types stay chain-native on purpose: viem returns its own
 * TransactionReceipt, Anchor returns a transaction signature. Forcing
 * a common shape would mean wrapping every call site, which is
 * abstraction for its own sake.
 */

export type ChainFamily = "evm" | "solana";

export interface ProjectData {
  hackathonIds: number[];
  githubUrl: string;
  projectName: string;
  milestoneDescriptions: string[];
  milestoneAmounts: string[] | number[];

  // Solana-specific optional extensions
  verifier?: string;
  builderSnsDomain?: string;
  builderSnsNameAccount?: string;
  launchOnBags?: boolean;
  bagsTokenMetadata?: { name: string; symbol: string; description: string };
  creditScore?: number;
}

export interface ProjectBackingData {
  totalBacking: string;
  backerCount: number;
  maxMultiplier: number;
  creditScore: number;
}

export interface ProjectDetails {
  isActive: boolean;
  creditScore: number;
  fundingAmount: string;
  milestonesCompleted: number;
  milestonesCount: number;

  // Solana-specific optional extensions
  builderSnsDomain?: string;
  builderSnsNameAccount?: string;
  bagsTokenAddress?: string;
}
