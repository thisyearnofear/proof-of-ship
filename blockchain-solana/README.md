# Solana program (Anchor)

This folder contains the Anchor program for the Solana side of Builder Credit.

## What was fixed vs the prototype

- Added an on-chain `Config` PDA that pins the **USDC mint** (prevents depositing arbitrary SPL tokens).
- `request_funding` now **creates the payout vault ATA** (project PDA authority) and a per-developer **treasury vault ATA**.
- `repay_loan` now sends repayments into the **treasury vault** (separate from milestone payout vault).
- Bounded project storage with explicit caps to prevent account overflows, and fixed `space` sizing.
- Added checked arithmetic + explicit errors.
- `claim_reward` now uses `Backing.multiplier` (e.g. 150 => 1.5x).
- Added starter tests + migration scaffolding.

## Local development

Prereqs:
- `solana` CLI installed
- `anchor` installed (matching `@coral-xyz/anchor` ~0.32)

```bash
cd blockchain-solana
anchor build
anchor test
```

## Devnet deploy (recommended)

1) Build & get the program id:

```bash
cd blockchain-solana
anchor build
anchor keys sync
```

2) Deploy:

```bash
anchor deploy --provider.cluster devnet
```

3) Initialize on-chain config (USDC mint):

```bash
# Devnet USDC mint:
# 4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX
anchor run init-config --provider.cluster devnet
```

4) Copy the generated IDL to the frontend (to avoid drift):

```bash
npm run idl:copy
```

5) Set frontend env vars (`.env.local` in `frontend/`):

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_PROGRAM_ID=<YOUR_DEPLOYED_PROGRAM_ID>
```

## Anchor scripts

`Anchor.toml` includes a TS test runner. Tests live in `tests/`.

