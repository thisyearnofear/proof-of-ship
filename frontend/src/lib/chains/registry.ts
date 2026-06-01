/**
 * Chain adapter registry.
 *
 * Single source of truth for "which service handles chain X". Today this
 * is a tiny pure function; the day we have 3+ chains it can resolve by
 * chainId. Today it resolves by family because EVM and Solana address
 * maps are intentionally separate (EVM uses chainId, Solana uses cluster).
 *
 * The adapters are the existing service singletons — creditService (EVM)
 * and solanaCreditService (Solana). They are NOT new classes. This file
 * is the lookup helper for callers that want a uniform entry point.
 */

import { creditService } from "../../services/creditService";
import { solanaCreditService } from "../../services/SolanaCreditService";
import type { ChainFamily } from "./types";

export interface ChainAdapter {
  family: ChainFamily;
  evm?: typeof creditService;
  solana?: typeof solanaCreditService;
}

export function getChainAdapter(family: ChainFamily): ChainAdapter | null {
  if (family === "evm") return { family: "evm", evm: creditService };
  if (family === "solana") return { family: "solana", solana: solanaCreditService };
  return null;
}
