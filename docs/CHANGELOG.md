# Changelog

## 2026-05-24 — Secrets Population, Vercel Deployment & Webhook Registration

Infrastructure completion: populated GCP secrets, synced to Vercel, deployed Firestore indexes, and registered Circle webhook.

### GCP Secret Manager
- Populated 9 of 11 secrets with actual values from local `.env` files and circle-recovery documents:
  - `circle-api-key`, `circle-entity-secret`, `circle-wallet-set-id`, `circle-agent-wallet-id` — from `frontend/.env.local`
  - `firebase-private-key`, `firebase-client-email` — from Firebase Admin SDK config
  - `github-token` — fine-grained PAT from `.env`
  - `featherless-api-key` — from Featherless.ai dashboard
  - `agent-api-key` — auto-generated via `openssl rand -hex 32`
- Secrets `circle-platform-wallet-id` and `circle-webhook-secret` remain empty (require Circle Console).
- Used entity secret from `~/Documents/circle-recovery/` to authenticate W3S API via `@circle-fin/developer-controlled-wallets` SDK.

### Vercel Env Sync
- `scripts/sync-secrets.sh` fixed for bash 3.x compatibility (macOS default) — replaced associative arrays with parallel arrays.
- Synced all 9 populated secrets + 8 config vars to Vercel production environment.
- Config vars synced: `FIREBASE_PROJECT_ID`, `CIRCLE_ENVIRONMENT`, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_SOLANA_*`, `BUILDER_CREDIT_ARC_ADDRESS`, `ALLOW_DEMO_PAYMENTS`.

### Firestore Indexes
- Deployed 9 composite indexes to production: `ships_logs`, `follow_events`, `projects` (×3), `payoutAttestations`, `circleIdempotency`, `webhookLogs`, `winnerClaims`.
- Removed 2 single-field indexes on `projects` (`createdAt`, `submittedAt`) — Firestore auto-creates these.

### Circle Webhook Registration
- Created webhook subscription via Circle Payments API (`POST /v1/notifications/subscriptions`).
- Endpoint: `https://proofofship.com/api/circle/webhook`.
- Status is "pending" — requires endpoint to be live for Circle verification.
- SDK used: `@circle-fin/circle-sdk` with `LIVE_API_KEY`.

### Environment Variables
- `.env.example`: No changes needed (already updated in prior pass).

### Files Changed
`scripts/sync-secrets.sh` | `firestore.indexes.json` | `docs/CHANGELOG.md`

### Secrets Populated
- `circle-platform-wallet-id`: `382dfd9c-9ef1-555d-a8f3-c362d71144b0` (from Circle Console → App ID)
- Remaining: `circle-webhook-secret` (from Circle Console → Webhooks after endpoint verification)

### Vercel Build Fix
- Fixed ESLint peer dependency conflict: `eslint-config-next@16.2.6` requires `eslint >=9.0.0`
- Updated eslint from `^8.57.0` to `^9.0.0`
- Created `eslint.config.mjs` with flat config for ESLint v9
- Removed deprecated `.eslintrc.json`
- Successfully deployed to production: `https://proof-of-ship.vercel.app`

---

## 2026-05-24 — GCP Secret Manager & Firestore Rules for New Collections

Infrastructure hardening for the Circle API consolidation and demo flow sunset.

### GCP Secret Manager
- Enabled `secretmanager.googleapis.com` on the `proofofship` GCP project.
- Created 11 secrets: `circle-api-key`, `circle-entity-secret`, `circle-wallet-set-id`, `circle-webhook-secret`, `circle-platform-wallet-id`, `circle-agent-wallet-id`, `firebase-private-key`, `firebase-client-email`, `github-token`, `agent-api-key`, `featherless-api-key`.
- Created `scripts/sync-secrets.sh` — pulls secrets from GCP Secret Manager and sets them as Vercel environment variables. Supports `--dry-run`.

### Firestore Rules
- Added rules for `circleIdempotency` (admin read, server-side write only).
- Added rules for `transactionStatuses` (admin read, server-side write only).
- Added rules for `webhookLogs` (admin read, server-side write only).
- Deployed updated rules to production.

### Firestore Indexes
- Added composite index for `circleIdempotency` (circleTxId + createdAt).
- Added composite index for `webhookLogs` (transactionId + receivedAt).

### Environment Variables
- `.env.example`: Added `CIRCLE_WEBHOOK_SECRET`, replaced `NEXT_PUBLIC_DEMO_MODE=true` with `ALLOW_DEMO_PAYMENTS=false`, added GCP Secret Manager header.
- CI workflow: Replaced `NEXT_PUBLIC_DEMO_MODE` with `ALLOW_DEMO_PAYMENTS`.

### Files Changed
`firestore.rules` | `firestore.indexes.json` | `.env.example` | `.github/workflows/ci.yml` |
`scripts/sync-secrets.sh` (new)

---

## 2026-05-24 — Demo Flow Sunset: Real Payments First

Replaced the auto-enabled demo mode with an explicit opt-in test mode.
Real x402 nanopayments are now the default experience for all users.

### Middleware (`nanopayment.js`)
- `isDemoMode()` renamed to `isTestMode()`. No longer auto-activates from `NODE_ENV === 'development'`.
- Test mode now requires explicit `ALLOW_DEMO_PAYMENTS=true` env var.
- Production guard: test mode is always disabled when `NODE_ENV === 'production'`, regardless of env var.
- `demoModeFlow()` renamed to `testModeFlow()`. Header changed from `x-demo-key: demo` to `x-test-mode: true`.
- `req.nanopayment.demo` field renamed to `req.nanopayment.testMode`.

### Client (`NanopaymentContext.tsx`)
- Default flipped: real payments first. Test mode only if user explicitly toggled it on (persisted in localStorage).
- localStorage key changed from `nanopayment-demo-mode` to `nanopayment-test-mode`.
- No longer auto-initializes test wallet in development.
- `x-demo-key` header replaced with `x-test-mode` header.

### UI (`NanopaymentWidget.js`, `EconomyTab.js`)
- Primary CTA changed from "Start in demo mode" to "Set up payment wallet".
- Test mode available as a small secondary link: "Or skip payments with test mode".
- Toggle label changed from "Demo mode" to "Test mode".
- Description changed from "Use simulated USDC" to "Payments skipped. Responses marked as test mode."
- Status bar changed from "Demo analysis mode" to "Test mode — payments skipped".

### Agent Endpoints
- `resultSource` no longer returns "demo" — always returns the actual source (rule_based, live_ai, cached, fallback).
- `paymentStatus` field changed from "demo" to "test_mode" when test mode is active.
- `paymentDemo` field renamed to `paymentTestMode` in execute.js.
- Chat help text no longer mentions demo mode.

### Files Changed
`nanopayment.js` | `NanopaymentContext.tsx` | `NanopaymentWidget.js` | `EconomyTab.js` |
`agent/scout.js` | `agent/underwrite.js` | `agent/verify.js` | `agent/chat.js` |
`agent/execute.js` | `agent/stream.js`

---

## 2026-05-24 — Circle API Consolidation: Mock Removal, W3S Migration, Webhooks

Production-hardening pass that eliminates all mock/fallback paths, consolidates
Circle integrations onto the W3S SDK, and adds push-based transaction settlement.

### Mock & Fallback Removal
- **`RealCircleService.ts`**: `processDeveloperFunding()` now throws when Circle API is not configured instead of silently returning mock data. `mockFunding()` method deleted.
- **`usdcPayments.js`**: Complete rewrite — delegates to `RealCircleService` instead of importing `@circle-fin/circle-sdk`. No mock fallback paths remain.
- **`FundingInterface.js`**: UI message changed from "demo mode" to "Funding unavailable — Circle API credentials not configured."

### SDK Consolidation (old `@circle-fin/circle-sdk` → W3S)
- **`api/circle/transactions.js`**: Migrated from `circle.wallets.*` to `realCircleService.createTransaction/getTransactionStatus`.
- **`api/circle/wallets/[id].js`**: Migrated to `realCircleService.getWalletById()`.
- **`api/circle/wallets/[id]/balances.js`**: Removed `formatTokenAmount` import from old utils.
- **`api/circle/config.js`**: Migrated from `getCircleEnvironment()` to `realCircleService.getConfig()`.
- **`api/circle/transfer.js`**: Replaced raw `fetch` calls to old REST API with `realCircleService.createTransaction()`.
- **`agent/execute.js`**: Migrated from raw REST + `generateEntitySecretCiphertext` to `realCircleService.createTransaction()` for contract execution.
- **`utils/circleApi.js`**: Stripped to pure formatting helpers (`formatCircleError`, `formatTokenAmount`). Old SDK initialization removed. Now dead code for API routes.
- **`CrossChainFunding.js`**: Removed `usdcPaymentService` import (was pulling `@circle-fin/circle-sdk` into client bundle). Now imports standalone `calculateFundingAmount` from `lib/funding/calculateFundingAmount.ts`.
- **`lib/funding/calculateFundingAmount.ts`** (new): Pure function module with no server-only or SDK imports. Safe for client components.

### Idempotency Persistence
- **`RealCircleService.ts`**: All `createTransaction`, `createWallet`, and `createContractExecutionTransaction` calls now check Firestore (`circleIdempotency` collection) before submitting. Records stored before Circle call, updated with transaction ID after.
- **`RealCircleService.ts`**: `generateIdempotencyKey()` now uses `crypto.randomUUID()` for deterministic keys. Overload accepts caller-provided idempotency key.

### Webhook Endpoint
- **`api/circle/webhook.js`** (new): Receives Circle push notifications for transaction status changes. HMAC-SHA256 signature verification. Updates `circleIdempotency`, `PayoutLogs`, and `transactionStatuses` Firestore collections. Requires `CIRCLE_WEBHOOK_SECRET` env var.

### Contract Validation
- **`RealCircleService.ts`**: `validateContractCall()` checks `contractAddress` against `BUILDER_CREDIT_CORE_ADDRESSES` allowlist and validates calldata function selector against known signatures (`backProject`, `approve`, `transfer`).

### Configuration Checks
- **`RealCircleService.ts`**: `isClientConfigured()` (apiKey + entitySecret) for transaction-only ops. `isWalletConfigured()` (+ walletSetId) for wallet operations. `getTransactionStatus()` uses `isClientConfigured()` so it works without `walletSetId`.
- **`RealCircleService.ts`**: `createTransaction()` uses `createContractExecutionTransaction()` (correct W3S SDK method) for contract calls instead of `createTransaction()` with mixed-in fields.
- **`RealCircleService.ts`**: `config.feeLevel` wired through to both `createTransaction()` and `createContractExecutionTransaction()`. Defaults to `"HIGH"` only when not specified.

### Files Changed
`RealCircleService.ts` | `usdcPayments.js` | `usdcPayments.test.js` | `CrossChainFunding.js` |
`FundingInterface.js` | `agent/execute.js` | `api/circle/config.js` | `api/circle/transactions.js` |
`api/circle/transfer.js` | `api/circle/wallets/[id].js` | `api/circle/wallets/[id]/balances.js` |
`api/circle/webhook.js` (new) | `lib/funding/calculateFundingAmount.ts` (new) | `utils/circleApi.js`

---

## 2026-05-21 — Whole-Platform Reduction Pass: Naming, Routes, Data, and Polish

This was a systematic multi-phase consolidation addressing every dimension identified
in the architectural review: naming coherence, route count, data layer consolidation,
and UI consistency.

### Phase 0 — Quick Wins
- **Fixed stale docs**: `docs/README.md` route table now matches the actual 13 routes
- **Added glossary**: `docs/GLOSSARY.md` — 18 domain terms defined in one place
- **Fixed dead collection ref**: `COLLECTIONS.USER_PROFILES` → `USERS` (matched Firestore rules)
- **Composite indexes added**: 4 indexes for projects (createdAt, ecosystem+createdAt, ecosystem+status) and payoutAttestations
- **Removed cross-chain verification fallback**: `VerificationService` no longer accepts EVM hashes for Solana projects or vice versa

### Phase 1 — Naming & Metaphor Consolidation
- **`expedition` → `project` everywhere**: renamed `useExpeditionData` → `useProjectData`, `ExpeditionCard` → `ProjectCard`, `expeditionMetrics` → `projectMetrics`, `components/expedition/` → `components/backer/`. 10+ consumer files updated.
- **`war-room` → `verification`**: `admin/war-room.js` → `admin/verification.js`, `useWarRoomData` → `useVerificationData`, Navbar label updated to "Verification Dashboard"
- **War-room `expeditions` → `hackathonGroups`**: the Firestore concept was about hackathon groupings for verifier assignment, not projects

### Phase 2 — Route Reduction (18 → 13 pages)
- **Removed**: `fleet.js`, `campaigns.js`, `feedback.js`, `design.js`, `about.js` — each redirected via `next.config.js` to closest equivalent
- **Merged auth**: `signup.js` replaced with redirect to `/login?mode=signup`

### Phase 3 — Data Layer Consolidation

**3.1 — Single `projects` collection:**
- **Writes**: removed dual-writes to `projects_{ecosystem}` in 4 files (submit.js, [slug].js, winding-down.js, DataService.ts)
- **Reads**: consolidated 6 read paths to query `projects` directly instead of iterating 8 ecosystem collections
- **Config**: `collections.ts` simplified — removed `PROJECTS` map, `getProjectCollection()`, `getAllProjectCollections()`
- **Rules**: collapsed 6 per-ecosystem Firestore rules blocks into one `/projects/{projectId}` block

**3.2 — WalletContext split (1,167 → 502 lines):**
- **NanopaymentContext.tsx** (273 lines) — extracted nanopayment state, payForAgent, deposit, and useNanopayment hook
- **CircleContext.tsx** (138 lines) — extracted Circle wallet creation, USDC transfer, useCircleWallet hook
- **CreditContext.tsx** (251 lines) — extracted builder credit, backProject, chain balance management
- **WalletContext.tsx** (502 lines) — stripped down to pure connection-only logic (MetaMask SDK + Solana adapter + network switching + token balances)
- All existing consumers continue to work via re-exports from WalletContext
- New context tree: WalletProvider → CircleProvider → CreditProvider → NanopaymentProvider

**3.3 — DataService split (736 → 4 files):**
- **DataServiceCore.ts** (387 lines) — caching infrastructure, GitHub API proxy, stats calculation
- **ProjectDataService.ts** (200 lines) — project loading (loadAllProjects, getProject), search, ecosystem stats
- **SubmissionService.ts** (77 lines) — project submission with validation and admin queue
- **DataService.ts** (7 lines) — pure re-exports hub; no consumer changes needed

**3.4 — Server/client split fix:**
- Moved `VerificationService.js` from `services/` to `lib/verification/` — correctly signals server-only code

### Phase 4 — Semantic Token Migration
- 143+ raw Tailwind class instances replaced with semantic CSS tokens across 9 high-traffic pages
- Patterns: `bg-white dark:bg-gray-800` → `bg-surface`, `text-gray-900` → `text-primary`, `border-gray-200` → `border-default`
- Pages migrated: explore.js (biggest win, ~100 replacements), leaderboard.js, back.js, build.js, compare.js, analyze.js, profile.js, admin/verification.js, transactions.js

### Phase 5 — UI Polish
- **Footer enriched**: 4-column layout with navigation links (Discover, Build, Resources, Status) and build version badge
- **Dark mode sweep**: remaining `bg-white` and `text-gray-900` without `dark:` variants fixed in 6 additional files
- **Mobile**: verified existing patterns are adequate (min-h-touch, responsive grids)

### Phase 6 — Firestore Transaction Safety
- **submit.js**: project write + permission grant wrapped in `db.runTransaction()`
- **payout-verify.js**: project claim update wrapped in `db.runTransaction()`

### Files Changed
`blockchain/contracts/HackathonRegistry.sol` | `docs/README.md` | `docs/CHANGELOG.md` | `docs/GLOSSARY.md` |
`docs/REDUCTION_PLAN.md` | `docs/PHASE3_PLUS.md` |
`frontend/src/contexts/WalletContext.tsx` | `frontend/src/contexts/NanopaymentContext.tsx` |
`frontend/src/contexts/CircleContext.tsx` | `frontend/src/contexts/CreditContext.tsx` |
`frontend/src/services/DataService.ts` | `frontend/src/services/DataServiceCore.ts` |
`frontend/src/services/ProjectDataService.ts` | `frontend/src/services/SubmissionService.ts` |
`frontend/src/services/PayoutVerifierService.ts` | `frontend/src/services/BuilderCredentialService.ts` |
`frontend/src/hooks/useProjectData.js` | `frontend/src/hooks/useVerificationData.js` |
`frontend/src/components/backer/ProjectCard.js` |
`frontend/src/components/common/layout/Footer/Footer.js` |
`frontend/src/components/common/layout/Navbar/Navbar.js` |
`frontend/src/components/common/BuilderTrust.tsx` |
`frontend/src/pages/leaderboard.js` | `frontend/src/pages/explore.js` |
`frontend/src/pages/back.js` | `frontend/src/pages/build.js` |
`frontend/src/pages/analyze.js` | `frontend/src/pages/profile.js` |
`frontend/src/pages/compare.js` | `frontend/src/pages/transactions.js` |
`frontend/src/pages/signup.js` | `frontend/src/pages/admin/verification.js` |
`frontend/src/pages/api/projects/submit.js` | `frontend/src/pages/api/projects/[slug].js` |
`frontend/src/pages/api/projects/winding-down.js` |
`frontend/src/pages/api/agent/payout-verify.js` |
`frontend/src/pages/api/hackathons/[id]/payout-timeline.js` |
`frontend/src/config/collections.ts` | `firestore.rules` | `firestore.indexes.json` |
`frontend/next.config.js`

### Files Created
- `frontend/src/services/PayoutVerifierService.ts` — verification service
- `frontend/src/pages/api/agent/payout-verify.js` — payout verification API
- `frontend/src/pages/api/hackathons/leaderboard.js` — leaderboard aggregation API

### Files Changed
- `frontend/src/pages/api/agent/analyze.js` — added `claim_verification` type
- `frontend/src/pages/leaderboard.js` — added Hackathons tab with FastestPayoutHero + ranked list
- `frontend/src/pages/projects/[ecosystem]/[slug]/index.js` — added ClaimVerificationBadge + analyze integration

## 2026-05-21 — Circle Agent Wallet Integration Verified

- Created ARC-TESTNET agent wallet via Circle API: `e7034022-f0c8-5c35-8f96-667b680c250b` (`0xdea33f28b244cf467a402808757bf75065cb7ee8`)
- Wallet funded with $20 USDC on Arc Testnet
- `execute.js` rewritten to use Circle's raw REST API for contract execution (SDK v10.3.1 has an axios interceptor bug with `createContractExecutionTransaction`)
- Uses `generateEntitySecretCiphertext` from SDK (works) + direct HTTPS POST to `/v1/w3s/developer/transactions/contractExecution` (works)
- Full flow verified: Circle signs and submits contract calls on Arc — approve USDC → backProject
- SDK bug tracked: `TypeError: Cannot read properties of undefined (reading 'config')` at line 46 of SDK bundle — axios response interceptor issue
- Created `frontend/scripts/create-agent-wallet.mjs` for future wallet creation
- `RealCircleService.createTransaction()` extended with contractAddress + calldata support (can be used once SDK is fixed)

## 2026-05-21 — Circle Agent Wallet Migration (execute.js)

- Solana program redeployed to **`DVzV16mVG9vHdrum9Fx9kGhzRv2GJa2mNnmTWUnKa6st`** on devnet
- EVM BuilderCreditCore redeployed on Arc Testnet via UUPS proxy:
  - Proxy: `0x26272b687df2c3607aCa3B6116c24B7400c3fC94`
  - Implementation: `0x2088E6C2c958E6d0d0b35d98b2d3B0E598527718`
  - HackathonRegistry: `0x6E303E2B8F386BfDEb201AeD5c2c011b98F2c6Bd`
- Deployment scripts refactored to deploy ERC1967 proxy directly (compatible with Arc RPC)
- `.env.example` and IDL updated with new deployed addresses
- Verified: registry, USDC token, admin role, sample hackathon all working on-chain

## 2026-05-21 — Architecture Fixes: Vault Solvency, EVM Upgradeability, Firestore Security

### Solana: Split Vault Architecture (fixes backer insolvency)
- **Root cause:** Single vault per project held both milestone funds and backer stakes. `verify_milestone` could drain it before backers claimed — the test worked around this by artificially minting USDC into the vault.
- **Fix:** Split into two vaults per project:
  - `milestone_vault` — milestone funding only, paid out via `verify_milestone`
  - `backer_escrow_vault` — backer stakes only, paid out via `claim_reward`
- Milestone payouts can no longer drain backer funds — each vault is isolated by PDA seed.
- New `fund_backer_rewards` instruction: protocol treasury funds multiplier premiums into the backer escrow vault (mirrors EVM `distributePrize`).
- New `withdraw_treasury` instruction: addresses the previous "no withdraw instruction exists" gap.
- `request_funding` creates both vault ATAs at project creation time.
- Frontend `SolanaCreditService.ts` updated with new PDA helpers (`getMilestoneVaultAuthorityPda`, `getBackerVaultAuthorityPda`) and account mappings for all instructions.
- Tests rewritten: validate vault isolation (milestone vault drains while escrow vault stays intact), `fund_backer_rewards` flow, no more artificial minting workaround.

### EVM: UUPS Upgradeability for BuilderCreditCore
- **Root cause:** Constructor-based deployment with no proxy pattern. `initialize()` was unreachable (guard checked `usdcToken == address(0)` but constructor already set it). Upgrades required full redeployment + state migration.
- **Fix:** Migrated to OpenZeppelin UUPS upgradeable pattern:
  - Added `Initializable`, `UUPSUpgradeable` imports
  - Constructor replaced with `_disableInitializers()`
  - `initialize(registry, usdcToken, admin)` sets all state and grants all roles
  - `_authorizeUpgrade()` gated to `DEFAULT_ADMIN_ROLE`
  - Storage layout preserved — same variables, same order
- New `scripts/upgrade.js` for future upgrades
- `deploy.js`, `deployTestnet.js`, `deployProduction.js` updated to use `upgrades.deployProxy()` with kind `"uups"`
- Tests updated to use `upgrades.deployProxy()` and include upgradeability test

### Firestore: Locked Down World-Writable Collections
- **Root cause:** `agentCache`, `agent_runs`, and `wallet_index` were `allow write: if true` (acknowledged in inline comments as hackathon-only). Four env vars used in code but missing from `.env.example`.
- **Fix:** All three collections set to `allow write: if false` — server-side admin SDK bypasses rules, so API routes continue to work while malicious clients are blocked.
- `agent_runs` read also restricted to admin-only.

### Files Changed
- `blockchain-solana/programs/blockchain-solana/src/lib.rs` — split vault, new instructions
- `blockchain-solana/tests/blockchain-solana.ts` — vault isolation tests
- `frontend/src/services/SolanaCreditService.ts` — new PDA helpers + account mappings
- `blockchain/contracts/BuilderCreditCore.sol` — UUPS upgradeable
- `blockchain/scripts/deploy.js`, `deployTestnet.js`, `deployProduction.js` — UUPS proxy deployment
- `blockchain/scripts/upgrade.js` — new upgrade script
- `blockchain/test/BuilderCreditCore.test.js` — UUPS-compatible tests
- `firestore.rules` — locked agentCache, agent_runs, wallet_index

## 2026-05-05 — QVAC Service Rewrite (Honest Local-First Architecture)

- Rewrote QvacService.ts from scratch — removed fake browser-based `import('@qvac/sdk')` that never worked
- New architecture: QVAC runs as a local HTTP server (`qvac serve`), service calls `localhost:PORT/v1/chat/completions` (OpenAI-compatible)
- Auto-detects local QVAC server via `/v1/models` health check with 10s cooldown cache
- Provider chain: QVAC local → Featherless cloud → AIsa → Rule-based fallback (same prompts, same structure)
- Updated /analyze page: removed fake "Load Model" button, added honest dual-path UI with "Retry Connection" and `qvac serve` instructions
- Source badge shows "On-Device (QVAC)" vs "Cloud API (Featherless)" — transparent about where inference runs
- Updated COLOSSEUM_SUBMISSION.md Local-First AI section with accurate architecture description
- Updated BuilderTrust component with score ring, tier, and behavioral signal chips
- Updated FairScoreService to match real FairScale API spec (GET-based, api2.fairscale.xyz, correct response shape)

## 2026-05-05 — Trust Infrastructure Redesign

- Created BuilderTrust.tsx — single source of truth for trust display across all surfaces
- BuilderTrustCompact: compact pill in ExpeditionCard badge row (score ring + tier + top behavioral signal)
- BuilderTrustFull: dedicated trust panel in BackingPanel before stake button (score, tier, badges, signal chips)
- BuilderTrustSkeleton: loading state so cards don't pop in jarringly
- deriveSignals() maps FairScale's 15-signal features to human-readable chips (active days, wallet age, conviction, dump history)
- BackingPanel: trust panel between description and multiplier selector — first thing backer sees before committing capital
- UserProfile: BuilderTrustFull below Ethos score
- Replaced FairScoreBadge usage across ExpeditionCard, BackingPanel, UserProfile

## 2026-05-05 — Soft-Delete with Grace Period

- DELETE handler checks for active backings before hard-deleting
- If backings exist, sets status to winding_down with 30-day expiry
- Quality gate in useExpeditionData filters out winding_down projects
- New /api/projects/winding-down endpoint: GET to list, POST to process expired projects (auto-extends if backings still active)
- Created FairScoreService.js, FairScoreBadge.tsx, useFairScore.ts hook, /api/reputation/score endpoint

## 2026-05-04 — Privacy as Platform Feature (Cloak Redesign)

- Reframed Cloak privacy from a buried toggle to a platform guarantee
- Created `PrivacyShield.js` with three exports:
  - `PrivacyOnboarding`: 3-step interactive explainer (The Problem → How We Protect You → It's Automatic) with visual comparisons of public vs shielded explorer views
  - `PrivacyInline`: compact purple callout for BackingPanel
  - `PrivacyBadge`: "Positions Shielded" badge for headers
- `back.js`: First-time backers see PrivacyOnboarding walkthrough on /back, PrivacyBadge in page header
- `BackingPanel.js`: Replaced PrivatePaymentsToggle with PrivacyInline guarantee (automatic, no toggle)
- `DiscoverTab.js`: Empty state shows privacy message; inline backing modal shows privacy guarantee before confirm
- `OnboardingBanner.js`: Backer step 3 changed from "Stake & Earn" to "Stake Privately"
- Cleared 16 skeleton projects from generic `projects` collection (zero descriptions, no ecosystem/GitHub)
- Platform now clean for user-driven submissions only

## 2026-05-04 — SNS Agent Domain Registration on Devnet

- Registered 4 agent .sol domains on Solana devnet: pos-scout.sol, pos-underwriter.sol, pos-verifier.sol, pos-rebalance.sol
- All domains owned by project wallet (G33naaudTAyEWFnfLET51aWGNLry5BwUtZt6KwcniFoj)
- Created `scripts/register-agent-domains.js` — registers all 4 domains via `createNameRegistry`, idempotent (skips existing)
- Created `scripts/verify-agent-domains.ts` — verifies domain ownership and prints explorer links
- Results written to `docs/agent-domain-results.json`

## 2026-05-04 — Cloak Demo Mode + Interactive Panel

- Added `getIntegrationStatus()`, `isMainnet()`, and `runDemoFlow()` to CloakPaymentService
- Created `CloakDemoPanel.js` — interactive 5-step demo with step-by-step progress, technical toggle (shows SDK method names), and run/reset controls
- `PrivatePaymentsToggle` now shows Demo/Live badge instead of hiding when Cloak isn't deployed on devnet
- Integrated CloakDemoPanel into the Back page AI Agents tab
- Created `/api/cloak/status` endpoint returning integration health, cluster, demo mode flag, and feature list

## 2026-05-04 — QVAC Standalone /analyze Page

- Created `/analyze` page — standalone project analysis with QVAC status indicator, project selector from Firestore, structured results (score/strengths/risks/recommendation), and credit score explanation via `qvacService.explainCreditScore()` (previously unused)
- Created `/api/agent/analyze` — cloud fallback endpoint using Featherless -> AIsa provider chain, includes rule-based analysis when no API keys set
- Added /analyze to Navbar navigation

## 2026-05-04 — Quality-Gated Backer Discovery

- `useExpeditionData` now loads from ecosystem collections (projects_solana, projects_celo, etc.) instead of sparse `projects` collection
- Quality gate filters out skeleton projects: must have name, 15+ char description, ecosystem, and GitHub URL
- `expeditionMetrics` derives meaningful variation from real project fields: description quality, GitHub presence, socials, team size, recency, stable hash variation
- Health baseline lowered to 30 (was 50), multiplier ranges 1.2x-2.5x based on completeness
- ExpeditionCard shows ecosystem badge, category, description preview, builder identity, Code/Website links
- DiscoverTab adds ecosystem filter, sort by Health/Confidence/Multiplier/Newest
- Updated 33 metric unit tests

## 2026-05-04 — Login & Auth Fixes

- Fixed TDZ error in login.js: moved computed vars and hooks above early returns (Rules of Hooks)
- Added 'Start over' button on login page: disconnects wallet, logs out, resets state
- Auto-detect walletFamily from connected state; auto-redirect returning users
- Clear phantom 'builder' role when no GitHub connected

## 2026-05-02 — SNS Ownership Proof Anchored On-Chain

- Extended the Solana `Project` account to store:
  - `builder_sns_domain`
  - `builder_sns_name_account`
  - `builder_identity_signature`
- Updated `request_funding` so project creation now requires:
  - a real SNS name account
  - a canonical builder identity-claim message
  - a preceding `Ed25519Program` verification instruction
- Updated `SolanaCreditService` to:
  - resolve the builder's primary `.sol`
  - derive the SNS name-account key
  - sign the identity-claim message with the connected wallet
  - prepend the Ed25519 proof instruction automatically
- Updated `devnet-transactions.ts` to require `SNS_DOMAIN` and reproduce the proof-aware Solana flow
- Updated Solana tests to exercise the SNS-aware requestFunding path using `SNS_DOMAIN` and `SNS_NAME_ACCOUNT`
- Updated frontend project persistence/read paths so `builderSnsDomain` and `builderSnsNameAccount` are stored and displayed directly

## 2026-05-02 — Solana Devnet Deployment + 7 Confirmed On-Chain Transactions

- Deployed Anchor program to Solana devnet: `14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K`
- IDL uploaded on-chain: `HGBAP7xUeuR3Nt99z8d2AhNDFGK5iN5sVdGd4W9jrdHr`
- Created `devnet-transactions.ts` — full transaction runner: treasury init, project creation, backer staking, milestone verification, loan repayment
- 7 confirmed transactions on Solana Explorer (devnet)
- Fixed Cloak Keypair/wallet-adapter mismatch — BackingPanel now generates ephemeral Keypair, funds via browser wallet
- Wired agent SNS identities into API responses (scout, underwrite, verify, chat)
- SnsIdentityBadge added to FundingInterface, ProjectDetails, DiscoverTab, PortfolioTab, ExpeditionCard
- Added blockchain-solana to pnpm workspace
- Frontend uses `NEXT_PUBLIC_SOLANA_PROGRAM_ID` env var for program address

## 2026-05-02 — QVAC Local-First AI Integration + Colosseum Submission

- Created `QvacService` — local-first AI inference via Tether's QVAC SDK
- Lazy-loaded @qvac/sdk with `webpackIgnore: true` for build-time safety
- Local project analysis, credit score explanation, and general completion
- Falls back to cloud providers (Featherless -> AIsa) when QVAC unavailable
- Wired QVAC into AI chat widget as first-choice provider with "on-device" badge
- Created Colosseum Frontier Hackathon Public Goods submission narrative
- Fixed lockfile drift from partial QVAC SDK install

## 2026-05-02 — Cloak Private Payments Integration

- Added Cloak SDK integration for shielded USDC transfers on Solana
- Created `CloakPaymentService` — deposit, withdraw, partial withdraw, batch payout, compliance scan
- Created `PrivatePaymentsToggle` component — purple shield toggle for Solana wallets
- Updated `BackingPanel.js` — backers can opt into shielded staking; amounts hidden from public explorers
- Supports backer staking, builder payouts, and batch treasury disbursements
- Viewing key support for compliance/audit without exposing transaction amounts

## 2026-05-02 — SNS Identity Track Integration

- Added SNS (Solana Name Service) integration for human-readable .sol domain identities
- Created `SnsService.ts` — resolves .sol names from wallet addresses with 5-min cache
- Created `useSnsName` React hook — lazy resolution with loading state and fallback
- Created `SnsIdentityBadge` component — displays .sol name with purple verification icon
- Updated `UserProfile.js` — linked Solana wallets show .sol names instead of truncated addresses
- Updated `login.js` — connected Solana wallet displays resolved .sol name
- Updated `UserContext.tsx` — backer wallet sign-in resolves .sol names for display names
- Created `lib/agentIdentity.ts` — defines .sol domain identities for all 4 AI agents
- Updated agent API responses (scout, underwrite, verify) to include `agent.snsDomain` field
- Updated `TransactionFeed.js` — agent transactions display .sol domain identities
- Updated snap-server Farcaster manifest with `agentIdentities` object
- Installed `@bonfida/spl-name-service` dependency

## 2026-04-24 — AI Chat Widget + Featherless AI + Docs Update

- Added floating AI Chat Assistant widget (`AIChatWidget.js`) accessible from every page
- Widget is collapsible (minimize button), dismissable (X with sessionStorage persistence), and reopenable (tiny pill)
- Chat API (`/api/agent/chat`) uses cascading AI providers: Featherless AI (DeepSeek-V3-0324) → AIsa Perplexity Sonar → contextual fallback
- Added `FEATHERLESS_API_KEY` env var for primary AI provider
- Updated README with features overview, AI provider chain docs, and env var reference
- Updated HACKATHON_ARC.md with all new features, files, and dual AI provider chain

## 2026-04-23 — UI Polish, Search, Onboarding, Project Flow

- Added search & filtering on explore page (real-time by name/description/category)
- Added onboarding banner (dismissible 3-step walkthrough for first-time visitors)
- Added SEO meta tags (Open Graph, Twitter Card) in `_document.js`
- Added IP-based rate limiting (30 req/min) to all agent API routes
- Added X/Farcaster share buttons on project detail pages
- Redesigned `/back` page Economy tab with agent explainer cards and cost breakdown
- Added TransactionFeed component showing live x402 nanopayment activity
- Added navbar balance indicator (⚡ $X.XX) linking to `/back` page
- Enriched profile page with My Projects section, nanopayment stats, transaction feed
- Fixed dead `/shippers` link → `/explore`, added Arc hero section on landing page
- Added all 7 ecosystems (Arc, Celo, Base, Linea, Arbitrum, Ethereum, Optimism) to explore page
- Improved project add/edit/delete flow: optional contract address, GitHub auto-populate, collapsible sections, localStorage drafts, delete with confirmation
- Toned down nautical theme on key pages, improved dark mode support
- Visual x402 flow diagram on landing page showing payment chain

## 2026-04-22 — AIsa x402 Integration + Nanopayment Fixes

- Wired AIsa Perplexity Sonar into all 3 agent endpoints (underwrite, scout, verify)
- Added `aisaClient.js` singleton x402-paying fetch client for AIsa endpoints on Arc Testnet
- Fixed missing `crypto` import in `nanopayment.js` that crashed all agent API routes
- Fixed `NanopaymentContext.tsx` demo mode (direct state init, demo-mode fetch with `x-demo-key` header)
- Added `NanopaymentProvider` and `UserBehaviorProvider` to `AppProviders.js`
- Fixed navbar Sign In button visibility (removed broken `hidden xs:flex` class)
- Updated `package-lock.json` to include `@x402/evm`, `@x402/fetch`, `zod` dependencies

## 2026-04-18 — Docs consolidation & mock data cleanup

- Removed 12 dead pages (`issues/*`, `pulls/*`, `releases/*`, `nebula-test`, `components`)
- Replaced `mockUserId` in hackathon detail page with real `useAuth()` user
- Removed `mockEvidence` fallback from war-room — uses real evidence feed only
- Removed `generateMockFundingApplication` from FundingStatusTracker — shows empty state when no data
- Consolidated 8 docs into 3 (`README.md`, `PRODUCTION_READINESS.md`, `CHANGELOG.md`)
- Deleted stale docs: `AGENT.md`, `DEMO_SCRIPT.md`, `ETHOS_INTEGRATION.md`, `HACKATHON.md`, `SETUP_GUIDE.md`, `CONSOLIDATION_PLAN.md`

## 2026-04-17 — Codebase consolidation (Phases 1–6)

### Phase 1: Dead code removal
- Deleted duplicate scripts between `/scripts` and `/blockchain/scripts`
- Deleted unused services (SocialProtocolService, EthosService, BaseService, ServiceManager)
- Collapsed DataService into EnhancedDataService
- Deleted old GithubProvider and legacy pages that depended on it
- Removed dead `/credit` nav link (page didn't exist yet)

### Phase 2: Auth consolidation
- Merged IdentityContext logic into AuthContext (IdentityContext kept for login wallet-linking)
- Renamed DecentralizedAuthContext → ReputationContext (it does scoring, not auth)

### Phase 3: BuilderCredit wired up
- Mounted BuilderCreditProvider in `_app.js`
- Merged two dashboards (`/dashboard` + `/builder-dashboard`) into single `/dashboard` with real contract data
- Created `/credit` page with live contract data (score, credit line, backings, collateral)

### Phase 4: Navigation consolidated
- Reorganized nav by user role: Explore / Build / Back / Verify

### Phase 5: Provider tree reduced
- Lazy-loaded expensive providers (LiFi, Circle, UserBehavior, Reputation)

### Phase 6: Remaining cleanup
- Merged `/ecosystems/celo.js` and `/ecosystems/base.js` into dynamic `/ecosystems/[id].js`

## 2026-04-17 — Snap + Mini-app

- Replaced Farcaster Frames with Snap + Mini-app standard
- Added scout snap and celebration snap

## Earlier — Feature development

- PR #10: Verification War Room dashboard
- PR #9: Dynamic multipliers and backer portfolio
- PR #8: Expedition Marketplace and admin payout simulation
- PR #7: Backer-Driven Liquidity Loop
- PR #6: Predictive credit loop
- PR #5: Predictive credit dashboard
- Hybrid Identity System, Linea Frontiers, token allocation, tester tasks, feedback system
