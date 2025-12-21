# Development Roadmap: Proof of Ship 2.0

**Vision**: The GitHub for On-Chain Apps—a transparent developer portfolio + community testing marketplace with equity upside.

**Mission**: 
- Developers showcase live on-chain traction (TVL, users, volume) + GitHub commit history
- Testers validate products at scale with USDC bounties + equity %
- Investors see authentic demand signals before funding

## 📋 Development Priorities

| Priority        | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| 🔥 **Critical** | Must be addressed immediately - blocking issues or security vulnerabilities |
| 🚀 **High**     | Essential for core functionality - should be addressed in current sprint    |
| 📈 **Medium**   | Important for product quality - address in upcoming sprints                 |
| 🔍 **Low**      | Nice to have - address when resources permit                                |

## 🔥 Phase 1: Foundation & Cleanup (1-2 Weeks)

### Codebase Consolidation
- 🔥 **Remove credit scoring system**
  - Delete: CreditScoringService, credit scoring hooks, scoring logic
  - Update: All references in dashboards and project pages
  - Replace with: On-chain traction metrics and GitHub analytics
  
- 🔥 **Remove governance/DAO stubs**
  - Delete: Decentralized governance contracts
  - Keep: Smart contract base for future phase if needed

- 🔥 **Consolidate authentication**
  - Audit: Multiple auth contexts (AuthContext, DecentralizedAuthContext)
  - Consolidate: Single source of truth for user identity
  - Remove: Redundant permission checking code

### Smart Contract Review
- 🔥 **Audit BuilderCredit contracts**
  - Confirm: Only essential contract functions needed
  - Remove: Stub functions, unused features
  - Deploy: Minimal, testable contract to Sepolia

### Testing Infrastructure
- 🔥 **Set up Jest for frontend**
  - Configure: Unit test suite
  - Add: Tests for critical components (Portfolio, ProjectCard, Feedback)
  
- 🔥 **Set up Hardhat tests for contracts**
  - Test: Core contract functionality
  - Add: Integration tests

## 🚀 Phase 2: On-Chain Traction Showcase (2-3 Weeks)

### On-Chain Metrics Integration
- 🚀 **Integrate Dune Analytics API**
  - Fetch: TVL, transaction volume, user count per contract
  - Store: Cache in Firestore (update every 6 hours)
  - Display: TractionCard component on project pages
  
- 🚀 **Add chain stratification**
  - Detect: Which chains contract is deployed on
  - Display: Chain badges on project cards
  - Filter: Discovery by chain (Ethereum, Polygon, Arbitrum, etc.)

- 🚀 **Create sector taxonomy**
  - Define: DeFi, Gaming, RWA, Health, Infrastructure, Social
  - Allow: Manual project classification
  - Enable: Discovery filtering by sector

### GitHub Analytics Integration
- 🚀 **Fetch GitHub contribution metrics**
  - API calls: User's commit frequency, PR history, test coverage
  - Cache: In Firestore with GitHub webhook for updates
  - Display: DeveloperCredibilityCard on portfolio

- 🚀 **Build credibility card**
  - Show: Commits/week, total PRs, active repos
  - Visual: Activity heatmap (similar to GitHub graph)
  - Update: Weekly via webhook or cron

## 🚀 Phase 3: Testing Campaign System (3-5 Weeks)

### Campaign Manager (Developer Side)
- 🚀 **Create testing campaign builder**
  - UI: Form to create bounty campaigns
  - Fields: Campaign title, description, reward structure (USDC amount or token %)
  - Schedule: Campaign duration, deadline
  - Storage: `testingCampaigns` Firestore collection

- 🚀 **Campaign dashboard (developer view)**
  - Display: Active campaigns, tester submissions, metrics
  - Actions: Approve/reject submissions, trigger payouts
  - Metrics: Application count, submission quality, estimated spend

### Campaign Discovery (Tester Side)
- 🚀 **Campaign listing page**
  - Filter: By sector, reward type, deadline
  - Display: Campaign cards with project info, reward details
  - CTA: "Apply to Test"

- 🚀 **Application + submission flow**
  - Reuse: Existing feedback form (attachments, evidence)
  - New: Optional token % allocation field
  - Submit: Video/screenshot evidence (required)

### Testing Workflow Integration
- 🚀 **Merge campaigns with testerTasks**
  - Unify: Campaign bounties and project-specific tasks
  - Firestore schema: `testingCampaigns` → `submissions` → feedback docs
  - API: Endpoint to list active campaigns for authenticated user

## 📈 Phase 4: Token Allocation & Equity Tracking (2-3 Weeks)

### Token Allocation System
- 📈 **Build token allocation tracker**
  - Data model: `testingCampaigns.tokenAllocation[tester_uid]` = {percentage, vestingSchedule, notes}
  - API: POST /api/campaigns/[id]/allocate-equity (dev + admin only)
  - Storage: Track vesting schedule (cliff, duration, release schedule)

- 📈 **Create equity commitment proof**
  - Export: PDF/JSON document of allocation commitments
  - Sign: Optional on-chain attestation (via Verifiable Credentials)
  - Legal: Ready for legal teams to formalize

- 📈 **Dashboard for tracking**
  - Dev view: Total % allocated, vesting timelines, recipient list
  - Tester view: Equity offered, vesting schedule, contract status
  - Admin view: All allocations for audit

### Payout Integration
- 📈 **Extend Circle integration for campaign payouts**
  - Trigger: On campaign completion, admin approves payouts
  - Split: USDC immediate + equity tracker (separate system)
  - Record: Store payout events in Firestore for audit trail

## 📈 Phase 5: Tester Reputation & Leaderboards (2 Weeks)

### Tester Profile & Metrics
- 📈 **Build tester reputation system**
  - Metrics: Total reviews submitted, avg quality score, earnings (USDC + equity)
  - Badges: "Top DeFi Tester", "Video Specialist", "Consistency Champion"
  - Visibility: Public tester profile, review history

- 📈 **Create quality scoring system**
  - Expand feedback: Add `qualityScore` field (1-5)
  - Helpfulness votes: Other users rate if review was helpful
  - Algorithm: Quality = (rating * 0.6 + helpfulness * 0.4)

### Leaderboards
- 📈 **Build public leaderboards**
  - Global: Top testers by earnings, reviews, quality
  - Sectoral: Top testers by sector (DeFi, Gaming, etc.)
  - Trending: New testers entering top 100
  - Update: Weekly via Firestore aggregation

### Notifications & Engagement
- 📈 **Tester engagement loop**
  - Notify: When campaign matches tester's interests
  - Remind: Submission deadline approaching
  - Celebrate: New badge earned, ranked up

## 🔍 Phase 6: Discovery UX & Optimization (1-2 Weeks)

### Enhanced Discovery
- 🔍 **Project discovery dashboard**
  - Filter: Chain, sector, funding stage, traction metrics
  - Sort: By TVL, activity, newest launches
  - Search: By name, category, developer
  - Save: Favorites and watch lists

- 🔍 **Tester discovery (for developers)**
  - Find: Testers by specialty (DeFi, Gaming, mobile)
  - Filter: By quality score, engagement, sector expertise
  - Invite: Direct outreach to top testers

### Performance & Caching
- 🔍 **Optimize data loading**
  - Cache: Traction metrics (6h), GitHub data (24h)
  - Pagination: Campaign listings, leaderboards
  - Lazy load: Detailed metrics on project page
  - CDN: Static assets, optimized images

## 📆 Milestone Definitions

### Milestone 1: Core Showcase (Weeks 1-3)
- ✅ Codebase consolidated (credit scoring removed)
- ✅ On-chain traction metrics live (Dune integration)
- ✅ GitHub credibility cards displayed
- ✅ Chain and sector filtering working

### Milestone 2: Testing Platform (Weeks 4-8)
- ✅ Campaign creation and discovery functional
- ✅ Testing workflow (submit + evidence) complete
- ✅ Token allocation tracker available
- ✅ Basic payout system integrated

### Milestone 3: Community Reputation (Weeks 9-10)
- ✅ Tester profiles and metrics aggregated
- ✅ Leaderboards live and updated weekly
- ✅ Quality scoring and voting system active
- ✅ Public reputation visible on platform

### Milestone 4: Marketplace Maturity (Week 11+)
- ✅ Enhanced discovery with all filters
- ✅ Performance optimized (sub-2s page loads)
- ✅ Mobile-first testing workflow
- ✅ Analytics dashboard for devs and admins

## 🛠️ Engineering Resources Required

### Phase 1-2 (Weeks 1-4)
- 1 Senior Backend Engineer (API, integrations)
- 1 Full-Stack Engineer (campaign system)
- 1 Frontend Engineer (UI/discovery)
- 1 Smart Contract Engineer (contract audit)

### Phase 3-4 (Weeks 5-8)
- Same team + 1 additional frontend for reputation UI

## 📈 Success Metrics

### User Engagement
- **Developers**: 100+ projects with traction metrics visible
- **Testers**: 50+ active testers in first month
- **Campaigns**: 20+ testing campaigns running concurrently

### Platform Health
- **Discovery**: 70%+ of visitors filter by sector/chain
- **Testing**: 200+ submissions in first quarter
- **Quality**: Avg review quality score > 4.0 / 5.0
- **Equity**: $500K+ in token allocations tracked

### Technical
- **Performance**: Page load < 2s, API response < 500ms
- **Uptime**: 99.9%+ availability
- **Code Quality**: Test coverage > 70%
- **Security**: Zero critical vulnerabilities

## 🎯 Core Principles Alignment

### ENHANCEMENT FIRST
- Extend existing portfolio system with traction metrics
- Reuse feedback form for campaign submissions
- Build on testerTasks framework for campaign tracking
- Leverage existing Circle integration for payouts

### AGGRESSIVE CONSOLIDATION
- Delete credit scoring (CreditScoringService, related hooks)
- Remove governance contract stubs
- Consolidate authentication contexts
- Unify campaign + feedback systems

### PREVENT BLOAT
- Single TestingCampaign model (no separate bounty system)
- Reuse TractionCard, not new dashboard widgets
- GitHub data fetched once, cached globally
- One leaderboard calculation, served multiple ways

### DRY
- Shared traction fetching service (Dune API wrapper)
- Reusable quality scoring algorithm
- Common payout triggers (USDC or equity)
- Single notification system for all alerts

### CLEAN
- Clear separation: Portfolio (showcase) / TestingCampaigns (validation)
- Explicit: What requires dev auth vs. tester auth vs. admin
- Decoupled: Traction metrics independent of project mutations
- Isolated: Equity tracking separate from cash payouts

### MODULAR
- TractionCard component: Independent of project page
- CampaignManager: Standalone feature, testable
- QualityScoring: Pure function, reusable algorithm
- Leaderboard: Generic aggregation, sector-agnostic

### PERFORMANT
- Traction data: Firestore caching with 6h TTL
- GitHub data: Webhook-triggered updates, no polling
- Leaderboards: Pre-computed weekly, served from cache
- Images: Optimized, CDN-delivered

### ORGANIZED
- `/src/components/showcase/` — Portfolio, TractionCard, DeveloperCard
- `/src/components/testing/` — CampaignManager, Submissions, Leaderboard
- `/src/lib/integrations/` — Dune, GitHub, CirclePayments
- `/src/pages/api/campaigns/` — Campaign CRUD and submissions
- `/src/pages/api/metrics/` — Traction and reputation aggregation

## 🔄 Migration from Old Architecture

### Remove (Deprecate First, Then Delete)
- ❌ `CreditScoringService` and all related hooks
- ❌ `DecentralizedAuthContext` (consolidate into AuthContext)
- ❌ Governance contract stubs
- ❌ Hackathon tracking system design docs
- ❌ Incentive points system docs

### Keep & Enhance
- ✅ Portfolio system → Add traction metrics + credibility cards
- ✅ Feedback system → Rename to TestingSubmission, extend for campaigns
- ✅ testerTasks → Integrate into TestingCampaigns
- ✅ Circle API → Extend for campaign payouts
- ✅ Firebase auth → Consolidate, keep strong

### New Integrations
- 🆕 Dune Analytics API → Traction metrics
- 🆕 GitHub GraphQL API → Developer analytics
- 🆕 Verifiable Credentials (optional) → Equity proofs

## 📊 Market Differentiation

**Proof of Ship 2.0** = GitHub Portfolio + Product Hunt Discovery + Equity Testnet

| Feature | Status | Why It Matters |
|---------|--------|---|
| On-chain traction (TVL, users, volume) | New | Investors see real demand, not hype |
| Developer commit consistency | New | GitHub as reputation proxy |
| Community testing with bounties | Enhanced | Users validate before invest |
| Token % allocation tracking | New | Testers get skin in game |
| Public reputation leaderboards | New | Quality self-regulates |
| Multi-chain + sector discovery | New | Organic market segmentation |

---

**Next Action**: Update IMPLEMENTATION_PLAN.md with detailed technical specs for each phase.
