# Reduction Plan: Proof of Ship

An implementation plan to consolidate the codebase from ~18 pages and 30+ concepts into a focused, maintainable product. Each phase is designed to be executed independently with clear exit criteria.

---

## Phase 0: Quick Wins (1-2 sessions)

Low-risk, high-visibility fixes that can be done without architectural changes.

### 0.1 Fix stale docs

**Files:** `docs/README.md`

Remove `/credit`, `/dashboard`, `/shippers` from the route table. Replace with the actual 10 routes. Drop the `docs/README.md` route table altogether — it drifted once and will drift again. The root `README.md` already has a `Key Frontend Routes` table — that's the canonical source.

### 0.2 Add vocabulary glossary

**New file:** `docs/GLOSSARY.md`

Define every domain term in one place:

| Term | Definition |
|------|------------|
| Builder | Developer submitting projects for funding |
| Backer | User staking USDC on builders |
| Expedition | *(deprecate)* A project presented to a backer |
| Torque | *(rename)* External incentive/boost system |
| Cloak | Privacy layer for shielded USDC transfers on Solana |
| QVAC | Tether's local-first AI inference SDK |
| Bags | Solana token-launch mechanism (Rail 1) |
| War Room | *(rename)* Milestone verification dashboard |
| Compass Score | Backer portfolio health metric |
| Trade Winds | Ecosystem-specific credit boosts |

### 0.3 Fix COLLECTIONS.USER_PROFILES dead reference

**File:** `frontend/src/config/collections.ts`

Change `USER_PROFILES: 'user_profiles'` to `USERS: 'users'` (matching the Firestore rules that use `/users/{userId}`). Fix any import sites.

### 0.4 Add missing Firestore composite indexes

**File:** `firestore.indexes.json`

```json
[{ "collectionGroup": "projects", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "createdAt", "order": "DESC" }
]}, { "collectionGroup": "payoutAttestations", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "projectSlug", "order": "ASC" },
  { "fieldPath": "createdAt", "order": "DESC" }
]}]
```

### 0.5 Remove the cross-chain verification fallback

**File:** `frontend/src/services/VerificationService.js`

The `_verifyOnchain()` method has a fallback that accepts any valid transaction hash regardless of ecosystem — it effectively bypasses verification. Remove this fallback or gate it behind an explicit `allowCrossChainFallback` flag.

---

## Phase 1: Naming & Metaphor Consolidation (2-3 sessions)

A single naming pass across the codebase. No logic changes — just renames and moves.

### 1.1 Rename `expedition` to `project` everywhere

This is the most impactful rename because `expedition` is an unnecessary synonym for `project` that splits the mental model. Every time a developer encounters `expedition` they have to remember it means "project in the backer context." That's cognitive overhead with zero benefit.

**Files to change:**

| File | What to change |
|------|----------------|
| `useExpeditionData.js` | Rename to `useProjectData.js`. Export `useProjectData`. |
| `expeditionMetrics.ts` | Rename to `projectMetrics.ts`. |
| `components/expedition/` directory | Rename to `components/backer/`. |
| `ExpeditionCard.js` -> `ProjectCard.js` | Internal refs + file rename (inside `backer/` dir) |
| `UserContext.tsx` (or wherever expedition refs exist) | Replace variable names |
| `explore.js` | Replace `useExpeditionData` import |
| `back.js` | Replace any expedition references |

**Migrate pattern:**
```js
// Old import
import { useExpeditionData } from '@/hooks/useExpeditionData';
const { projects, loading } = useExpeditionData();

// New import
import { useProjectData } from '@/hooks/useProjectData';
const { projects, loading } = useProjectData();
```

Keep the old file as a re-export wrapper for one release cycle to catch unrenamed references:
```js
// useExpeditionData.js -> delete after one cycle
export { useProjectData as useExpeditionData } from './useProjectData';
```

### 1.2 Rename `war-room` to `verification`

| Old | New |
|-----|-----|
| `/admin/war-room` | `/admin/verification` |
| `useWarRoomData.js` | `useVerificationData.js` |
| `WarRoomDashboard.js` | `VerificationDashboard.js` |

### 1.3 Rename `fleet` to `map` (or remove the page)

The page shows pseudo-random coordinates — it's a novelty, not a feature. Two options:
- **Remove:** Delete `fleet.js` and the nav link. No documented purpose in any product doc.
- **Rename:** To `/map` so the URL at least suggests a visual page. Only do this if you intend to make it useful.

Recommendation: **Remove it.** It's not referenced in any doc or navigation pattern.

### 1.4 User-facing rename for Cloak

The internal service can stay `CloakPaymentService.ts`. User-facing UI components and documentation should use "private payments" or "shielded transfers." The `Cloak` name evokes espionage, not privacy.

**Files:** `PrivacyShield.js`, `PrivacyOnboarding`, `CloakDemoPanel` — these already use "Privacy" in the component name. No change needed here — just ensure all new UI uses "Private Payments" not "Cloak."

---

## Phase 2: Route & Navigation Reduction (2-3 sessions)

The goal is 10 pages max, organized by user role.

### 2.1 Remove these routes

| Route | Reason |
|-------|--------|
| `/fleet` | Novelty page, no product purpose |
| `/campaigns` | Testing feature disconnected from core product |
| `/feedback` | One-page feedback form — use a modal or external tool |
| `/design` | Design system showcase — dev-only, not a user page |
| `/about` | About page — can be a section on the landing page |

### 2.2 Merge auth paths

| Route | Action |
|-------|--------|
| `/login` | Keep as single auth entry point |
| `/signup` | Remove. Route `/signup` -> redirect to `/login?mode=signup`. The login page already handles both paths. |

### 2.3 Final nav structure

```
For everyone:
  /            - Landing page (trimmed, CTA-focused)
  /explore     - Project discovery (merged from /explore + /back Discover)

For builders:
  /build       - Builder dashboard (project submission, credit profile, milestones)

For backers:
  /back        - Backer workspace (portfolio, AI analysis, discover projects)

For everyone:
  /leaderboard - Rankings (builders, backers, hackathons)
  /analyze     - Standalone AI analysis
  /profile     - User profile with credentials
  /compare     - Side-by-side project comparison

Auth:
  /login       - Role picker + GitHub + wallet

Admin:
  /admin/verification  - Milestone verification (renamed from war-room)
```

That's **10 routes.** Down from 18.

### 2.4 Merge `/explore` and `/back` Discover tab

These are the same concept (project discovery) with different affordances:
- `/explore`: For anyone, read-only, rich filters
- `/back` Discover tab: For authenticated backers, shows backing UI

The `/back` page should import the explore component and overlay the backing affordances when the user is a backer. This keeps one code path for project discovery instead of two diverging implementations.

---

## Phase 3: Data Layer Consolidation (3-4 sessions)

### 3.1 Single `projects` collection

**The problem:** Every project is written to both `projects/{slug}` AND `projects_base/{slug}` (or similar per-ecosystem). This duplicates data and creates partial-write risk (no atomicity).

**The fix:** Migrate to a single `projects` collection with an `ecosystem` field. Add a composite index on `[ecosystem, createdAt]` instead of using separate collections.

**Migration approach:**
1. Add `ecosystem` field to all existing project docs (it likely already exists)
2. Create the composite index
3. Update `DataService.submitProject()` to write to `projects/{slug}` only (drop the dual-write)
4. Update `DataService.loadAllProjects()` to read from `projects` with optional `ecosystem` filter
5. Update `DataService.loadProjectsByEcosystem()` to use `where('ecosystem', '==', x)`
6. Remove `COLLECTIONS.PROJECTS` map and `getProjectCollection()` from `collections.ts`
7. Update Firestore rules — the per-ecosystem `match /projects_base/{projectId}` blocks collapse into a single `match /projects/{projectId}` with an `isProjectOwner('projects', projectId)` check

```js
// Before
await setDoc(doc(db, COLLECTIONS.PROJECTS_GENERIC, slug), projectDoc);
await setDoc(doc(db, getProjectCollection(inputData.ecosystem), slug), projectDoc);

// After
await setDoc(doc(db, 'projects', slug), { ...projectDoc, ecosystem: inputData.ecosystem });
```

**Risk:** This changes the data model. The migration must handle existing docs in both `projects/` and `projects_*/`. Run a one-time script to merge.

### 3.2 Split WalletContext into focused contexts

**The problem:** `WalletContext.tsx` is ~1,167 lines handling 5+ concerns. It's the highest-priority architectural debt item.

**Split into 4 contexts:**

| New Context | Responsibility | Lines from WalletContext |
|-------------|----------------|------------------------|
| `WalletContext` | MM + Solana connection, account, chainId, network switching | ~300 lines |
| `CreditContext` | On-chain credit profile, `useBuilderCredit` hook, funding requests | ~300 lines |
| `NanopaymentContext` | AI agent micropayments, balance, transactions | ~200 lines |
| `CircleContext` | Circle wallet creation, USDC transfers | ~200 lines |

**Migration steps:**

1. Extract `NanopaymentContext.tsx` first (most self-contained)
2. Extract `CircleContext.tsx` next
3. Refactor `CreditContext` from the remaining ~500 lines of wallet-related + credit-related code
4. Strip `WalletContext.tsx` down to connection-only (~300 lines)

Each extraction is safe:
- Create the new context file
- Move the state + methods
- Export the new context's provider
- Import the new context into `_app.js` alongside `WalletProvider`
- Update consumers: change `useWallet()` to `useNanopayment()` etc.

```js
// _app.js after split
<WalletProvider>
  <CirclesProvider>
    <CreditProvider>
      <NanopaymentProvider>
        {children}
      </NanopaymentProvider>
    </CreditProvider>
  </CirclesProvider>
</WalletProvider>
```

### 3.3 Break up DataService.ts (~800 lines)

**Split into:**
- `GitHubDataService.ts` — GitHub caching, repo analytics
- `ProjectDataService.ts` — project CRUD, search, load from Firestore
- `SubmissionService.ts` — project submission, validation, admin queue

### 3.4 Fix VerificationService server/client split

`VerificationService.js` imports `firebase-admin` from `lib/firebase/serverOnly` but lives in `services/` which is treated as client-side. Two fixes:
- Move the file into `pages/api/` or `lib/` with an explicit server-only marker
- Or split it: `VerificationService.js` (client-side, no admin SDK) + `lib/VerificationEngine.js` (server-side with admin SDK)

---

## Phase 4: Semantic Token Migration (3-5 sessions, can run parallel with Phase 3)

The most effective visual improvement per hour spent. The design system has excellent semantic tokens — pages just don't use them.

### 4.1 Priority pages (high traffic)

| Page | Lines | Dominant pattern | Replace with |
|------|-------|------------------|--------------|
| `explore.js` | ~1,584 | `bg-white dark:bg-gray-800` | `bg-surface` |
| `leaderboard.js` | ~462 | `text-gray-900 dark:text-gray-100` | `text-primary` |
| `back.js` | ~600+ | varied | `bg-surface`, `text-primary` |
| `build.js` | ~500+ | varied | `bg-surface`, `text-primary` |

### 4.2 Pattern map

```jsx
// Instead of:
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">

// Use:
<div className="bg-surface text-primary border-default">
```

**Migration is mechanical** — it's a large find-and-replace, not creative work. Each file can be done independently.

### 4.3 Standardize loading/empty/error state usage

After the token migration, audit every page for its loading, empty, and error states:

| State | Should use |
|-------|------------|
| Loading (page) | `<ExplorePageSkeleton />` or `<DashboardSkeleton />` from `LoadingStates.js` |
| Loading (section) | `<LoadingSpinner size="md" />` with `bg-surface` container |
| Empty | `<EmptyStateIllustrations.NoProjects />` or similar |
| Error | `<ErrorBoundary name={name} errorMessage={msg} />` or `ErrorStateIllustrations` |

Remove all inline `<p>Failed to load</p>` and empty `setProjects([])` without user feedback.

---

## Phase 5: UI Polish & Responsiveness (2-3 sessions)

Low-risk, high-visibility improvements after the naming/data consolidation.

### 5.1 Footer enrichment

Replace the current anemic footer with links: Explore, Build, Back, Privacy, Terms, Twitter/GitHub links. Add a build version / last-deployed badge.

### 5.2 Mobile responsive audit

| Page | Issue | Fix |
|------|-------|-----|
| `explore.js` | 4-column filter panel on mobile | Collapse filters behind a toggle on small screens |
| Navbar | Touch targets below 44px | `py-2` -> `py-3` on mobile nav items |
| `leaderboard.js` | StatCard grid 4 columns on tiny screens | `grid-cols-2` -> `sm:grid-cols-2` |
| All skeleton screens | Some not responsive | Add `md:` breakpoints to skeleton components |

### 5.3 Dark mode coverage sweep

Run a `grep` for any `bg-white` or `text-gray-900` without a `dark:` counterpart. These are the remaining dark-mode gaps.

---

## Phase 6: Firestore Transaction Safety (1 session)

Add `runTransaction()` wrappers for all multi-collection writes.

### 6.1 Critical paths to wrap

| Code path | Why |
|-----------|-----|
| `submitProject()` -> writes to projects + admin_queue | After Phase 3, this will be a single write — still wrap in transaction for safety |
| `payout-verify.js` -> writes attestation + updates project claim | Two collections, must be atomic |
| Any delete cascade | If you add collection group deletes on project removal |

---

## Implementation Order (Recommended)

```
Week 1: Phase 0 (quick wins) + Phase 1 (naming)
  -> Immediate value: docs match reality, vocabulary is clear, expedition is gone

Week 2: Phase 2 (route reduction)
  -> Navigation is clean, 10 pages

Week 3-4: Phase 3 (data consolidation)
  -> WalletContext split, single projects collection, DataService split
  -> This is the riskiest, so do it when you have dedicated focus

Week 5: Phase 4 (semantic tokens)
  -> Visual consistency jumps immediately

Week 6: Phase 5 + 6 (polish, transactions)
  -> Footer, mobile, dark mode, write safety
```

---

## Hard Constraints

These things the plan must NOT change:

- **The 3-rail capital stack** (Bags -> x402 Credit -> Prize Routing). This is the product's best conceptual model. Make it visible in the UI.
- **The multi-chain abstraction** (`activeChainFamily` routing). This is well-designed.
- **The smart contract architecture** (UUPS upgradeable, split vaults on Solana, HackathonRegistry separation). These are correct.
- **The BFF pattern** (Next.js API routes as server-side proxy). This is correct.
- **The payout verification system** (3-provider architecture in PayoutVerifierService). This is the moat.
- **The Firestore security model** (`write: if false` + server SDK bypass). This is correct.

---

## Anti-Goals

What this plan explicitly does NOT do:

- Add new features. This is a reduction plan.
- Migrate to another framework (no React -> Next App Router, no SWR/React Query, no Prisma). Not the right time.
- Add tests. The codebase needs them, but that's a separate initiative.
- Full TypeScript migration. The JS/TS split is annoying but not blocking. Fix it opportunistically.
