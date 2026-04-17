# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 19cf2165-992c-4356-9b96-464208f9eb5a -->

**Status**: ✅ Completed

**Difficulty Assessment**: HARD

**Output**: Created comprehensive technical specification at `.zenflow/tasks/new-task-bdfc/spec.md`

Key findings:
- Task requires consolidation and enhancement of existing systems rather than greenfield development
- Must follow strict core principles: ENHANCEMENT FIRST, AGGRESSIVE CONSOLIDATION, DRY, CLEAN
- Three main feature areas: Portfolio enhancement, Hackathon tracking completion, Incentives system
- Identified significant code duplication to consolidate (hackathon cards, shared components)
- Complex integration of multiple systems (Firebase, Circle API, MetaMask, USDC payments)

---

## Implementation Plan

The following steps break down the implementation into testable milestones:

### [ ] Step 1: Code Audit & Consolidation
<!-- chat-id: e1ff3130-32dc-44f9-b05f-58ea583a4564 -->

**Goal**: Identify and consolidate duplicate code, establish baseline

**Tasks**:
1. Audit all hackathon-related components for duplication
2. Consolidate `HackathonCard` from `pages/hackathons.js` and `pages/builder-dashboard.js` into shared `components/hackathons/HackathonCard.js`
3. Remove duplicate code and update all imports
4. Verify no regressions by running existing pages

**Verification**:
- Run `npm run lint` and `npm run build`
- Manually check `/hackathons` and `/builder-dashboard` pages still work
- No console errors

**Files Modified**:
- `frontend/src/components/hackathons/HackathonCard.js` (new)
- `frontend/src/pages/hackathons.js`
- `frontend/src/pages/builder-dashboard.js`

---

### [ ] Step 2: Portfolio System Enhancement

**Goal**: Enhance existing portfolio system with theming, analytics, and featured showcase

**Tasks**:
1. Create `components/portfolio/PortfolioTheme.js` for theming system
2. Create `components/portfolio/PortfolioAnalytics.js` for view tracking
3. Create `components/portfolio/FeaturedPortfolios.js` for homepage showcase
4. Update `pages/u/[username].js` to support theme customization
5. Update `pages/index.js` to include featured portfolios section
6. Create API endpoint `api/portfolio/[username]/analytics.js`
7. Create API endpoint `api/portfolio/[username]/track-view.js`
8. Update user schema in Firestore to include portfolio settings

**Verification**:
- Portfolio displays with different themes
- Analytics track views correctly
- Featured portfolios show on homepage
- Responsive on mobile/tablet/desktop
- Run `npm run lint` and `npm run build`

**Files Created**:
- `frontend/src/components/portfolio/PortfolioTheme.js`
- `frontend/src/components/portfolio/PortfolioAnalytics.js`
- `frontend/src/components/portfolio/FeaturedPortfolios.js`
- `frontend/src/pages/api/portfolio/[username]/analytics.js`
- `frontend/src/pages/api/portfolio/[username]/track-view.js`

**Files Modified**:
- `frontend/src/pages/u/[username].js`
- `frontend/src/pages/index.js`
- `firestore.rules`

---

### [ ] Step 3: Hackathon System Completion

**Goal**: Complete hackathon tracking with full lifecycle support

**Tasks**:
1. Create `components/hackathons/HackathonTimeline.js` for visual timeline
2. Create `components/hackathons/ParticipationFlow.js` for registration/submission
3. Create `components/hackathons/PrizeAnnouncement.js` for winner announcements
4. Enhance API `api/hackathons/index.js` with POST (create) and filtering
5. Enhance API `api/hackathons/[id].js` with PUT (update) and DELETE
6. Create API `api/hackathons/[id]/register.js` for user registration
7. Update `pages/hackathons/[id].js` to show timeline and participation
8. Update Firestore security rules for hackathon participants

**Verification**:
- Admin can create/update/delete hackathons
- Users can register for hackathons
- Timeline displays correctly for all phases
- Winners can be announced and verified
- Run `npm run lint` and `npm run build`

**Files Created**:
- `frontend/src/components/hackathons/HackathonTimeline.js`
- `frontend/src/components/hackathons/ParticipationFlow.js`
- `frontend/src/components/hackathons/PrizeAnnouncement.js`
- `frontend/src/pages/api/hackathons/[id]/register.js`

**Files Modified**:
- `frontend/src/pages/api/hackathons/index.js`
- `frontend/src/pages/api/hackathons/[id].js`
- `frontend/src/pages/hackathons/[id].js`
- `firestore.rules`

---

### [ ] Step 4: Incentives System - Task Board

**Goal**: Implement public task board for browsing and claiming tasks

**Tasks**:
1. Create `services/IncentivesService.js` for business logic
2. Create `components/incentives/TaskCard.js` for individual task display
3. Create `components/incentives/TaskBoard.js` for browsing/claiming tasks
4. Create `pages/tasks/index.js` for task board page
5. Create `pages/tasks/[taskId].js` for task detail page
6. Create API endpoint `api/tasks/index.js` for listing tasks (GET)
7. Create API endpoint `api/tasks/[taskId].js` for task details (GET)
8. Create API endpoint `api/tasks/[taskId]/claim.js` for claiming tasks (POST)
9. Update project schema to support testerTasks if not already present

**Verification**:
- Task board displays all available tasks
- Users can filter tasks by ecosystem, reward, etc.
- Users can claim tasks (authenticated)
- Task status updates correctly after claiming
- Run `npm run lint` and `npm run build`

**Files Created**:
- `frontend/src/services/IncentivesService.js`
- `frontend/src/components/incentives/TaskCard.js`
- `frontend/src/components/incentives/TaskBoard.js`
- `frontend/src/pages/tasks/index.js`
- `frontend/src/pages/tasks/[taskId].js`
- `frontend/src/pages/api/tasks/index.js`
- `frontend/src/pages/api/tasks/[taskId].js`
- `frontend/src/pages/api/tasks/[taskId]/claim.js`

**Files Modified**:
- `frontend/src/pages/api/projects/[slug].js` (task management)

---

### [ ] Step 5: Incentives System - Submission & Rewards

**Goal**: Implement evidence submission and reward distribution

**Tasks**:
1. Create `components/incentives/TaskSubmission.js` for evidence submission
2. Create `components/incentives/RewardHistory.js` for earnings history
3. Create `components/incentives/TesterLeaderboard.js` for top testers
4. Create API endpoint `api/tasks/[taskId]/submit.js` for task submission (POST)
5. Enhance `api/feedback/submit.js` to link with taskId
6. Enhance `api/funding.js` to support task reward distribution
7. Create IncentivesContext for state management
8. Update user schema to track earnings and reputation

**Verification**:
- Users can submit evidence for claimed tasks
- Evidence links to feedback system
- Admin can approve/reject submissions
- USDC rewards distribute correctly upon approval
- Reputation scores update correctly
- Reward history displays accurately
- Run `npm run lint` and `npm run build`

**Files Created**:
- `frontend/src/components/incentives/TaskSubmission.js`
- `frontend/src/components/incentives/RewardHistory.js`
- `frontend/src/components/incentives/TesterLeaderboard.js`
- `frontend/src/pages/api/tasks/[taskId]/submit.js`
- `frontend/src/contexts/IncentivesContext.js`

**Files Modified**:
- `frontend/src/pages/api/feedback/submit.js`
- `frontend/src/pages/api/funding.js`
- `firestore.rules`

---

### [ ] Step 6: Design System Application

**Goal**: Apply consistent design system across all new and modified components

**Tasks**:
1. Audit all new components for design consistency
2. Create beautiful empty states for task board, hackathons, portfolio
3. Add smooth transitions and animations to all interactions
4. Ensure consistent spacing, typography, and colors
5. Optimize for mobile (responsive design, touch targets)
6. Implement accessibility improvements (keyboard nav, ARIA labels)
7. Add loading states and error handling to all components

**Verification**:
- All components follow design system guidelines
- Consistent visual identity across platform
- Smooth animations (150ms-500ms durations)
- Mobile-optimized with proper touch targets (44x44px minimum)
- Keyboard navigation works throughout
- Screen reader compatible
- No console warnings

**Files Modified**:
- All components created in previous steps
- `frontend/src/styles/globals.css`
- `frontend/src/styles/themes.css`

---

### [ ] Step 7: Integration & Testing

**Goal**: Integrate all systems and perform comprehensive testing

**Tasks**:
1. Update `pages/builder-dashboard.js` to integrate all new features
2. Update navigation to include links to task board
3. Test complete user flows end-to-end:
   - Portfolio creation → customization → viewing
   - Hackathon registration → submission → prize
   - Task claim → evidence submission → reward
4. Run lint: `npm run lint`
5. Run build: `npm run build`
6. Test on multiple screen sizes (mobile, tablet, desktop)
7. Test with screen reader (basic accessibility check)
8. Performance audit with Lighthouse

**Verification**:
- All user flows work without errors
- No console errors or warnings
- Lint passes without errors
- Build completes successfully
- Lighthouse score > 85 (target 90)
- Responsive on all screen sizes
- Basic accessibility requirements met

**Files Modified**:
- `frontend/src/pages/builder-dashboard.js`
- Navigation components as needed

---

### [ ] Step 8: Documentation & Completion Report

**Goal**: Document implementation and create completion report

**Tasks**:
1. Add code comments to all new components and services
2. Update API documentation for new endpoints
3. Create completion report at `.zenflow/tasks/new-task-bdfc/report.md`
4. Document any known issues or future improvements
5. Update environment variables documentation if needed

**Verification**:
- All code has meaningful comments
- report.md exists and is comprehensive
- No TODO comments remain in code

**Files Created**:
- `.zenflow/tasks/new-task-bdfc/report.md`

**Files Modified**:
- Various files for code comments
