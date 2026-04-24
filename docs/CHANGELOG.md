# Changelog

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
