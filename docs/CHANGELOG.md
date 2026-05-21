# Changelog

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
