# Builder Credit Platform

Decentralized platform where backers fund builders and hackathon prizes collateralize credit.

> **New:** See [VISION.md](./VISION.md) for the unified capital-stack narrative (Bags Token → x402 Credit → Prize Routing) and how the agentic layer prices, scouts, and verifies across all three rails.
>
> **Arc update:** See [HACKATHON_ARC.md](./HACKATHON_ARC.md) for the current Arc agent integration, including the simplified `setup → analyze → review` flow, explicit demo/live payment states, and result-source metadata.

## How It Works

1. **Backers** stake USDC on builders with 1.5x, 2x, or 3x reward multipliers.
2. **Builders** pledge expected hackathon prizes to collateralize their credit line.
3. **Market confidence** (total backing) determines the builder's credit limit.
4. **AI analysis** helps users decide what to back, with small USDC payments settling on Arc.
5. **Prize wins** are routed through the platform to automatically repay backers (principal + interest), then the builder.

## Architecture

```
/
├── frontend/             # Next.js app
│   └── src/
│       ├── components/   # UI components
│       ├── config/       # Environment config
│       ├── contexts/     # React context providers
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Integrations (LiFi, Dune, GitHub analytics, Arc payment middleware)
│       ├── pages/        # Next.js pages + API routes
│       ├── services/     # Business logic (Circle, Solana credit, Cloak privacy, SNS identity, QVAC local AI)
│       └── utils/        # Utilities
│
├── blockchain/           # Hardhat workspace (UUPS upgradeable contracts)
├── blockchain-solana/    # Anchor program (split vault architecture)
├── snap-server/          # Hono-based Farcaster Snap server
└── docs/                 # Documentation
```

## Current Arc Agent UX

The main happy path is now:
1. Open **Back → Discover**
2. Run **Scout** or open **AI Agents**
3. Use **demo** or **live** payment mode
4. Review the returned `status`, `resultSource`, and `nextAction`
5. Decide whether to back the project

The UI now avoids ambiguous progress states and makes it clear when a result came from:
- live AI
- cache
- demo mode
- fallback logic
- rule-based logic

## Key Frontend Routes

| Route | Who | What |
|-------|-----|------|
| `/` | Everyone | Landing page |
| `/shippers` | Everyone | Project explorer |
| `/credit` | Builders | Credit profile |
| `/dashboard` | Builders | Unified builder dashboard |
| `/back` | Backers | Discover + AI analysis workspace |
| `/admin/war-room` | Verifiers | Milestone verification dashboard |

## Smart Contract Architecture

### Solana (Anchor): Split Vault Design

Each project has **two separate vault ATAs** to prevent insolvency:

```
Project
 ├── milestone_vault_authority → milestone_vault
 │     Holds milestone funding only. verify_milestone pays from here.
 │     Backer funds cannot be drained by milestone payouts.
 │
 └── backer_vault_authority → backer_escrow_vault
       Holds backer stakes only. claim_reward pays from here.
       Multiplier premiums funded by protocol treasury via fund_backer_rewards.
       Backers can always reclaim their principal.
```

The protocol treasury accumulates loan repayments and sponsor contributions. `fund_backer_rewards` moves treasury USDC into a project's backer escrow vault to cover the `(multiplier - 100) / 100` premium on backer payouts — analogous to the EVM `distributePrize` function.

### EVM (Solidity): UUPS Upgradeable

`BuilderCreditCore` is deployed behind an OpenZeppelin UUPS proxy. The `initialize(registry, usdcToken, admin)` function replaces the constructor pattern. `_authorizeUpgrade()` is gated to `DEFAULT_ADMIN_ROLE`.

```bash
# Deploy (deploys implementation + ERC1967 proxy in one go)
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deployTestnet.js --network arcTestnet
npx hardhat run scripts/deployProduction.js --network base

# Upgrade later
BUILDER_CREDIT_PROXY_ADDRESS=0x26272b... npx hardhat run scripts/upgrade.js --network arcTestnet
```

When upgrading, new implementations must preserve the existing storage layout — append new variables at the end, never reorder or delete.

### Current Deployments

| Contract | Network | Address |
|----------|---------|---------|
| Solana Program | devnet | `DVzV16mVG9vHdrum9Fx9kGhzRv2GJa2mNnmTWUnKa6st` |
| BuilderCreditCore (proxy) | Arc Testnet | `0x26272b687df2c3607aCa3B6116c24B7400c3fC94` |
| HackathonRegistry | Arc Testnet | `0x6E303E2B8F386BfDEb201AeD5c2c011b98F2c6Bd` |

### Upgrading

To upgrade BuilderCreditCore with new logic:
1. Write a new contract preserving storage layout (append new vars at end)
2. Deploy the new implementation: `npx hardhat run scripts/upgrade.js --network <network>`
3. Set `BUILDER_CREDIT_PROXY_ADDRESS` env var to the proxy address

## Integrations

- **Circle / Arc** — USDC settlement and nanopayment-backed agent calls
- **MetaMask SDK** — wallet connection
- **Solana Name Service (SNS)** — .sol identity
- **Cloak** — private USDC transfers
- **QVAC** — local-first on-device AI inference
- **Firebase** — auth + Firestore
- **GitHub API** — repo analytics and identity verification

## Setup

### Prerequisites
- Node.js (see `.nvmrc`)
- MetaMask or another Web3 wallet

### Install & Run

```bash
npm run setup
npm run dev
```

### Frontend checks

```bash
cd frontend
npm test -- --run src/lib/__tests__/agentIdentity.test.ts
./node_modules/.bin/tsc --noEmit
```

## License

MIT
