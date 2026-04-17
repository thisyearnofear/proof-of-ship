# Consolidation Plan

## Current State

- 38 user-facing pages, 9 contexts, 11 services, 94 components, 13 hooks
- 55K LOC across 491 files
- Smart contracts are solid but disconnected from frontend (BuilderCreditProvider not even in _app.js)
- 4 services imported by nothing (SocialProtocolService, EthosService, BaseService, ServiceManager)
- 5 identical duplicate scripts between `/scripts` and `/blockchain/scripts`
- 2 data services (DataService → EnhancedDataService extends it, only Enhanced is used)
- 2 dashboards (`/dashboard` uses real contracts, `/builder-dashboard` uses all mock data)
- 2 GitHub providers (old `GithubProvider` only used by hidden legacy pages)
- 3 auth contexts with overlapping responsibilities
- `/credit` in nav → 404 (page deleted)
- 9 legacy pages (issues/*, pulls/*, releases/*) hidden in nav, using old provider

---

## Phase 1: Delete Dead Code (no behavior change)

**Goal:** Remove code that is provably unused. No features lost.

### 1a. Delete identical duplicate scripts
Keep `blockchain/scripts/`, delete from root `scripts/`:
- `deploy-contracts.js` (identical)
- `deploy-firestore-rules.js` (identical)
- `list-users.js` (identical)
- `list-projects.js` (identical)
- `create-project.js` (identical)
- `deploy.js` (identical)
- `deploy-production.sh` (identical)

Keep unique root scripts: `cleanup.js`, `setup-env.js`, `sync-github.js`

### 1b. Delete unused services
These 4 services are not imported by any page, component, or hook:
- `frontend/src/services/SocialProtocolService.js` (696 LOC)
- `frontend/src/services/EthosService.js` (195 LOC)
- `frontend/src/services/BaseService.js` (231 LOC)
- `frontend/src/services/ServiceManager.js` (161 LOC)

### 1c. Collapse DataService into EnhancedDataService
`EnhancedDataService extends DataService`. Only `EnhancedDataService` is imported anywhere.
- Inline `DataService` methods into `EnhancedDataService`
- Delete `DataService.js`
- Rename to just `DataService.js` (it's the only one now)

### 1d. Delete old GithubProvider
`providers/Github/Github.js` is only used by the 9 hidden legacy pages.
- Delete `providers/Github/Github.js`
- Delete the 9 legacy pages that depend on it:
  - `pages/issues/*` (6 files)
  - `pages/pulls/*` (4 files including index)
  - `pages/releases/index.js`
- Remove hidden nav items for Issues, Pulls, Releases from Navbar

### 1e. Delete test/dev pages
- `pages/nebula-test.js` — test page
- `pages/components.js` — component showcase, not user-facing

### 1f. Fix dead nav link
- Remove `/credit` from Navbar (page doesn't exist)

**Estimated removal: ~4,500 LOC, 25+ files**

---

## Phase 2: Consolidate Auth (3 contexts → 1)

**Goal:** Single auth context that handles wallet + GitHub + identity.

Current state:
| Context | Used by | What it does |
|---------|---------|-------------|
| `AuthContext` | 33 refs across pages/components | Firebase auth, GitHub username, project permissions |
| `DecentralizedAuthContext` | 4 pages (signup, shippers, ecosystems) | Wallet + GitHub + Farcaster + Lens + credit scoring |
| `IdentityContext` | 1 page (login) | Links wallet ↔ GitHub identity |

**Plan:**
- Merge `IdentityContext` into `AuthContext` (it's only used in login.js, 1 consumer)
- Keep `DecentralizedAuthContext` for now but rename to `ReputationContext` — it's doing reputation scoring, not auth
- Move the wallet-linking logic from `DecentralizedAuthContext` into `AuthContext`
- `AuthContext` becomes: Firebase auth + wallet connection + identity linking
- `ReputationContext` becomes: credit scoring + social protocol analysis (read-only, no auth state)

This reduces the provider tree from 9 deep to 8, and eliminates the "which auth do I use?" confusion.

---

## Phase 3: Wire Up BuilderCreditContext (mock → real)

**Goal:** The core product loop works end-to-end with real contract data.

### 3a. Add BuilderCreditProvider to _app.js
It's defined but never mounted. Add it inside MetaMaskProvider (it depends on wallet connection).

### 3b. Merge the two dashboards
- `/dashboard` has real contract integration (DeveloperDashboard, FundingInterface, CrossChainTransfer)
- `/builder-dashboard` has the better UI layout but all mock data

**Action:** Take `/builder-dashboard`'s layout, replace mock data functions with real contract calls from `/dashboard`'s components. Result: single `/dashboard` page with the unified layout and real data.

Delete `/builder-dashboard.js`.

### 3c. Replace mock data in key pages
| Page | Current mock | Wire to |
|------|-------------|---------|
| `/builder-dashboard` → `/dashboard` | `fetchMockHackathons()`, `fetchMockEligibility()`, `fetchMockPredictiveCredit()` | `useBuilderCredit()` + hackathon API |
| `/backer-portfolio` | Random `myStake`, `myMultiplier`, `potentialReturn` | `coreContract.projectBackings()` (already partially wired) |
| `/admin/war-room` | `mockEvidence` array | Contract events + GitHub API (evidence feed) |
| `/hackathons/[id]` | `mockUserId` | `useAuth().currentUser` |
| `/expedition` | `alert()` on back button | `coreContract.backProject()` via BackingPanel |

### 3d. Create the missing `/credit` page
This is the builder's credit profile — the central page of the product.
- Shows: credit score, credit line (total/used), reputation history
- Shows: active backings and their multipliers
- Shows: pledged prizes and collateral ratio
- Data source: `useBuilderCredit()` → `creditLines[address]`, `developerProjects[address]`

Route: `/credit` (already in nav, just needs the page)

---

## Phase 4: Consolidate Navigation by User Flow

**Goal:** Nav tells the story of the three user types.

Current nav (flat, confusing):
```
Home | Credit(404) | Shippers | Expedition | Backer Portfolio | Hackathons | Feedback | Submit
```

Proposed nav:
```
Explore | Build | Back | Verify
```

Mapping:
| Nav Item | Pages | Who it's for |
|----------|-------|-------------|
| **Explore** | `/shippers` (project explorer), `/hackathons` | Everyone |
| **Build** | `/credit` (credit profile), `/dashboard` (unified), `/projects/new`, `/feedback` | Builders |
| **Back** | `/expedition` (marketplace), `/backer-portfolio` | Backers |
| **Verify** | `/admin/war-room`, `/admin/payout-simulation` | Organizers/Verifiers |

- Logged-out users see: Explore + "Get Started"
- Builders see: Explore + Build
- Backers see: Explore + Back
- Admins/Verifiers see: all four

Keep `/about`, `/login`, `/signup`, `/profile`, `/u/[username]` as utility routes (not in main nav).

---

## Phase 5: Reduce Provider Tree

**Goal:** Fewer contexts wrapping the entire app. Lazy-load expensive ones.

Current _app.js provider stack (11 deep):
```
ErrorBoundary → NoSSR → ThemeProvider → ToastProvider → ErrorBoundary →
MetaMaskProvider → LiFiProvider → CircleWalletProvider →
DecentralizedAuthProvider → UserBehaviorProvider → AuthProvider →
IdentityProvider → EnhancedGithubProvider
```

After consolidation:
```
ErrorBoundary → NoSSR → ThemeProvider → ToastProvider →
AuthProvider (merged) → MetaMaskProvider →
BuilderCreditProvider → EnhancedGithubProvider
```

Contexts to lazy-load (only mount on pages that need them):
- `LiFiProvider` → only `/dashboard` (cross-chain transfer tab)
- `CircleWalletProvider` → only `/dashboard` (funding interface)
- `UserBehaviorProvider` → only dashboard components that use recommendations
- `ReputationContext` (renamed DecentralizedAuth) → only `/signup`, `/credit`

This cuts the always-mounted provider tree from 11 to 8, and the expensive ones (LiFi, Circle, Reputation) only initialize when needed.

---

## Phase 6: Clean Up Remaining Duplication

### 6a. Consolidate ecosystem pages
`/ecosystems/celo.js` (353 LOC) and `/ecosystems/base.js` (428 LOC) are nearly identical.
→ Single `/ecosystems/[id].js` dynamic route with ecosystem config.

### 6b. Consolidate campaign pages
`/campaigns.js`, `/campaigns/new.js`, `/campaigns/[id].js` — keep as-is, they're properly structured.

### 6c. Move unique root scripts
- `scripts/cleanup.js` → `blockchain/scripts/cleanup.js`
- `scripts/setup-env.js` → `blockchain/scripts/setup-env.js`
- `scripts/sync-github.js` → `blockchain/scripts/sync-github.js`
- Delete `scripts/` directory

### 6d. Consolidate CSS
4 CSS files: `globals.css`, `nautical.css`, `themes.css`, `utils.css`
→ Merge `nautical.css` and `utils.css` into `globals.css` (they're all global styles)
→ Keep `themes.css` separate (it's the theme variable definitions)

---

## Execution Order

| Phase | Effort | Risk | Impact |
|-------|--------|------|--------|
| 1. Delete dead code | Small | None | -4,500 LOC, cleaner codebase |
| 2. Consolidate auth | Medium | Low | Simpler mental model, fewer providers |
| 3. Wire BuilderCredit | Large | Medium | **Core product loop works** |
| 4. Consolidate nav | Small | Low | Coherent user experience |
| 5. Reduce providers | Medium | Medium | Better performance, simpler _app.js |
| 6. Clean up remaining | Small | None | Final polish |

Phase 1 is pure deletion — zero risk, immediate clarity.
Phase 3 is the big one — it's what makes the product real.
Phases 2, 4, 5, 6 can be done in any order around Phase 3.

---

## Final State

After all phases:
- ~28 pages (down from 38)
- 3-4 contexts in _app.js (down from 11)
- 1 data service (down from 2)
- 1 auth context (down from 3)
- 1 dashboard (down from 2)
- 1 GitHub provider (down from 2)
- 0 dead nav links
- 0 unused services
- 0 duplicate scripts
- Core credit loop working end-to-end with real contract data
- Navigation organized by user role
- ~40K LOC (down from 55K)
