# A-Minus Plan: What It Would Take to Get to A- Across All Dimensions

Each dimension needs specific, scoped work. This is not another reduction pass — it's a polish and surface-area pass.

---

## Product Design: B+ → A-

**The gap:** Vision is excellent. Execution still has 3 leftover issues: the 3-rail capital stack is invisible in the UI, QVAC/Bags/Torque don't cross-pollinate, and the landing page doesn't sell the product.

### 1.1 Make the 3-rail visible in the UI

The best conceptual model the product has lives in `VISION.md` but nowhere in the app itself. Add a **capital-stack visual** on the landing page and the `/build` page:

On the landing page, replace the current hero section with a 3-step visual:
```
  ┌─ Pre-prize ───────┐   ┌─ Mid-stage ────────┐   ┌─ Settlement ────┐
  │  Bags Token        │→  │  x402 Credit Line  │→  │  Prize Routing  │
  │  Community capital │   │  USDC backed       │   │  Auto-repay     │
  │  Fee-share yield   │   │  Milestone-based   │   │  Any chain      │
  └────────────────────┘   └────────────────────┘   └────────────────┘
```

On `/build`, show the builder which rail they're on and what the next rail unlocks. A first-time builder sees "You're on Rail 1 (Bags Token) — unlock milestone credit by shipping."

**Files:** `frontend/src/pages/index.js`, `frontend/src/pages/build.js`

### 1.2 Cross-pollinate QVAC into the agent flow

QVAC currently only fires on `/analyze`. The agent endpoints (scout, underwrite, verify) use Featherless → AIsa as their provider chain but never check for QVAC. Add QVAC detection to the agent BFF routes in `pages/api/agent/` — same pattern the analyze page uses (auto-detect local QVAC server, use it as first choice, fall back).

**Files:** `frontend/src/pages/api/agent/scout.js`, `underwrite.js`, `verify.js`

### 1.3 Wire Bags into the landing page

Bags (Rail 1) is a documented feature with zero UI presence. Add a Bags section to the landing page when Solana wallet is detected: "Launch a project token" CTA that links to the Bags integration point. Even a simple Card on `/build` that says "Launch your Bags token" would make it real.

**Files:** `frontend/src/pages/index.js`, `frontend/src/components/common/BagsMarketCard.js`

### Estimated effort: 1-2 sessions

---

## UI/UX: B → A-

**The gap:** ~60% semantic token adoption is good but not great. ~40% remaining raw classes. The empty/error state illustration library is unused. Button.js still uses raw Tailwind colors.

### 2.1 Final semantic token sweep

Run the same sed script from Phase 4 across the remaining files. About 10-15 files still have scattered `bg-white`, `text-gray-900`, `border-gray-200` instances:
- Component files in `frontend/src/components/` (the Card and Button are clean, but ProjectEditor, FundingInterface, BackingPanel etc. aren't)
- `frontend/src/pages/admin/payout-simulation.js`, `admin/payouts.js`, `admin/submissions.js`
- `frontend/src/pages/hackathons/[id].js`

Target: 90%+ adoption across all pages.

**Effort:** 1 session of mechanical find-and-replace.

### 2.2 Migrate Button.js to semantic tokens

`Button.js` still uses `bg-primary-500` instead of `var(--color-primary)`. Add the CSS variable `--color-primary` and `--color-error` etc. to `themes.css` and update Button.js. This is the most visible component on the site.

**Files:** `frontend/src/styles/themes.css`, `frontend/src/components/common/Button.js`

### 2.3 Use the illustration library

The codebase has 8 specific error states and 8 specific empty states in `LoadingIllustrations.js` / `EmptyStateIllustrations.js` / `ErrorStateIllustrations.js`. Pages don't use them. Audit every page and replace inline `<p>No projects found</p>` with `<EmptyStateIllustrations.NoProjects />`.

**Files:** All 13 pages — 1 session of systematic adoption.

### 2.4 Smooth out the loading state inconsistency

Some pages use `<LoadingSpinner size="lg" />` (spinner) while others use `<SkeletonProjectGrid />` (skeleton). Standardize: page-level loading uses skeletons (SkeletonDetailPage, SkeletonProjectGrid from LoadingStates.js), section-level uses spinners.

### 2.5 Add a loading transition on the signup → login redirect

The `signup.js` redirect just shows a blank page until the redirect fires. Add a `<LoadingSpinner />` in the redirect page.

**Estimated effort: 2-3 sessions**

---

## System Architecture: B+ → A-

**The gap:** The big structural items are fixed. What remains is smaller but not cosmetic: the `require()` pattern in CreditContext, the JS/TS split in services, and no migration script for Firestore data.

### 3.1 Replace `require()` in CreditContext with top-level imports

The `useBuilderCredit` hook in `CreditContext.tsx` uses `require()` for UserContext and Firestore:
```js
function lazyUserContext() { return require('@/contexts/UserContext').useUser(); }
function lazyFirebase() { ... }
```

This exists because the original code had a circular dependency concern when these were all in WalletContext. Now that CreditContext is its own file, test whether top-level imports work. If they do, replace the `require()` calls with imports.

**Files:** `frontend/src/contexts/CreditContext.tsx`

### 3.2 Run the Firestore migration script

Write and run a one-time script that merges existing data from `projects_{ecosystem}` collections into the `projects` collection. This is needed because the Phase 3.1 consolidation stopped new writes but existing docs in `projects_celo`, `projects_base`, etc. won't appear in the single-collection queries until they're copied.

**New file:** `scripts/migrate-projects-to-single-collection.mjs`

### 3.3 Consolidate the remaining JS/TS split in services

The service layer has 9 `.ts` files and 5 `.js` files. Convert the `.js` files to TypeScript:
- `RealGitHubService.js` (302 lines)
- `RealLiFiService.js` (415 lines)
- `FairScoreService.js` (233 lines)
- `EthosService.js` (195 lines)
- `creditService.ts` is already TS (180 lines)

This is low-risk since none of these are new logic — just adding types to existing code.

**Effort:** 1-2 sessions per file

### 3.4 Remove the unused `loadEcosystemProjects` method

After Phase 3.1, `loadEcosystemProjects` in `DataServiceCore.ts` is dead code. It's also dead in the old `DataService.ts` (it references `getProjectCollection` which no longer exists). Remove it.

**Files:** `frontend/src/services/DataServiceCore.ts`

### 3.5 Rename remaining `projects_{ecosystem}` collections in Firestore rules comments

The `firestore.rules` file still has comments referencing `/projects_celo/` style collections. These were removed in the Phase 3.1 rules cleanup but double-check.

**Estimated effort: 2-3 sessions**

---

## Intuitiveness & Cogency: B- → A-

**The gap:** Three competing metaphors (banking, naval, military). The 3-rail capital stack isn't visible in the UI. A few opaque names remain (Torque, Cloak, QVAC).

### 4.1 Standardize on one metaphor

Currently three collide:
| Domain | Terms | Surface |
|--------|-------|---------|
| **Banking/Finance** | credit, back, fund, repay, stake, build | Best description of what the product actually does |
| **Naval/Shipping** | ship, fleet, voyage, trade winds, compass, anchor | Thematic window dressing on `/`, logo, and loading states |
| **Military** | war-room | Already renamed to `verification` — but one lingering reference in comments |

The military metaphor is already gone. The naval metaphor is cosmetic (theme, logo, loading animations). The banking metaphor is the right one for navigation and routes. The naval elements in the CSS (`nautical.css`, wave animations, ship icons) are fine as visual theming — they just shouldn't leak into route names, variable names, or component names.

**Action:** Audit `nautical.css` usage — it should be purely decorative (animations, backgrounds). If any `.nautical-*` CSS class is used on interactive elements like buttons, links, or data containers, remove it.

**Files:** `frontend/src/styles/nautical.css`, plus grep for usage across components

### 4.2 Rename Torque to something descriptive

`TorqueService.ts`, `useTorqueIncentives.js` — "Torque" is rotational force. The service tracks builder shipping velocity and backer engagement. Rename to something self-explanatory like `EngagementService.ts` or `VelocityService.ts`.

**Effort:** 30 minutes, mechanical rename. Keep backward-compat re-export.

### 4.3 Add inline JSDoc to all exported functions in opaque-named services

`CloakPaymentService.ts`, `QvacService.ts`, `EthosService.js` — these have opaque names. Each already has a top-level JSDoc comment. Verify the comments exist on all exported functions so a developer can cmd-click and understand what the function does without reading the implementation.

**Effort:** 30 minutes — read each service and add JSDoc where missing.

### 4.4 Make the 3-rail stack visible in the UI

(This is the same item as 1.1 — it's the single highest-impact change for both product design AND intuitiveness. Users can't understand what the product does if the core conceptual model is hidden in docs.)

**Effort:** 1 session

### 4.5 Final stale reference audit

Run `grep -rn 'expedition\|shippers\|war.room\|user_profiles\|getProjectCollection\|dashboard'` across all non-vendor source files to find any remaining stale concept references that survived the renames.

**Effort:** 30 minutes

**Estimated effort: 1-2 sessions**

---

## Summary

| Dimension | Current | Target | Key work | Effort |
|-----------|---------|--------|----------|--------|
| **Product Design** | B+ | A- | Make 3-rail visible in UI, cross-pollinate QVAC, wire Bags | 1-2 sessions |
| **UI/UX** | B | A- | Final token sweep, Button.js migration, use illustration library, standardize loading states | 2-3 sessions |
| **System Architecture** | B+ | A- | Fix require() pattern, run Firestore migration, consolidate JS/TS, remove dead code | 2-3 sessions |
| **Intuitiveness** | B- | A- | Standardize metaphor, rename Torque, make 3-rail visible, JSDoc pass, stale ref audit | 1-2 sessions |

**Total: ~6-10 focused sessions** (2-3 weeks part-time).

The work is scoped — none of these are research phases. Every item is a known change with a known file list. The only one that requires care is the Firestore migration script (3.2), which should be tested against a backup first.
