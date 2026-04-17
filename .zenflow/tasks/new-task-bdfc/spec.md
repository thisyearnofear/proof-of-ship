# Technical Specification: Onchain Builder Portfolio Platform

## Task Complexity Assessment

**Difficulty: HARD**

This is a complex, multi-faceted task requiring:
- Integration of existing portfolio, hackathon, and feedback systems
- Implementation of token-based incentive mechanisms
- Careful consolidation following ENHANCEMENT FIRST principle
- Multiple interconnected features spanning frontend, backend, and smart contracts
- High architectural complexity with cross-system dependencies
- Strict adherence to core design principles while avoiding bloat

## Technical Context

### Stack
- **Frontend**: Next.js 14.2.35, React 18.3.1, Tailwind CSS
- **Backend**: Firebase Firestore, Firebase Admin SDK
- **Blockchain**: Ethereum/Polygon/Celo (multi-chain), Ethers.js 5.7.2
- **Payments**: Circle API (USDC), MetaMask SDK
- **Package Manager**: pnpm (workspace setup)

### Current Architecture
The platform already has foundational elements:
- **Portfolio System**: Subdomain routing, user profiles at `/u/[username]`
- **Project Management**: Submit, edit, and display projects across ecosystems
- **Hackathon Tracking**: Basic pages and API endpoints at `/api/hackathons`
- **Feedback System**: Submission with optional taskId, evidence attachments, admin approval
- **Incentives Framework**: `testerTasks` on projects, `budgetRemainingUSDC` tracking
- **Payment Infrastructure**: Circle API integration, USDC transfers via `/api/funding`

### Design Principles
1. **ENHANCEMENT FIRST**: Always extend existing components over creating new ones
2. **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
3. **PREVENT BLOAT**: Audit and consolidate before adding features
4. **DRY**: Single source of truth for shared logic
5. **CLEAN**: Clear separation of concerns
6. **MODULAR**: Composable, testable, independent modules
7. **PERFORMANT**: Adaptive loading, caching, optimization
8. **ORGANIZED**: Predictable structure with domain-driven design

## Implementation Approach

### Strategy: Enhance & Consolidate

Rather than building from scratch, we will:
1. **Audit existing code** for overlapping functionality
2. **Consolidate components** into reusable, composable modules
3. **Enhance existing features** to meet full requirements
4. **Fill gaps** with minimal new code
5. **Remove redundant code** to prevent bloat

### Core Feature Areas

#### 1. Portfolio System Enhancement
**Status**: Partially implemented, needs enhancement

**Existing**:
- `/pages/u/[username].js` - User portfolio page
- `/api/portfolio/[username]` - Portfolio data API
- `middleware.js` - Subdomain routing

**Enhancements Needed**:
- Featured portfolio showcase on homepage
- Rich project cards with ecosystem badges
- Portfolio customization options (themes, layouts)
- Portfolio analytics (views, engagement)
- Social sharing and embedding

**Components to Enhance**:
- `components/projects/ProjectCard.js` - Add portfolio display mode
- `pages/index.js` - Add featured portfolios section
- Create `components/portfolio/PortfolioTheme.js` - Theming system

#### 2. Hackathon Tracking System
**Status**: Basic implementation exists, needs completion

**Existing**:
- `/pages/hackathons.js` - Hackathon listing page
- `/pages/hackathons/[id].js` - Hackathon detail page
- `/api/hackathons/index.js` - List hackathons API
- `/api/hackathons/[id].js` - Hackathon detail API
- `/api/hackathons/[id]/participants.js` - Participants API
- `services/VerificationService.js` - Verification logic

**Enhancements Needed**:
- Complete CRUD operations for hackathons (admin)
- User participation flow (registration, submission)
- Timeline tracking (inception → submission → judging → prizes)
- Feedback integration during hackathon lifecycle
- Winner announcements and verification
- Integration with builder dashboard

**Components to Consolidate**:
- Merge hackathon cards from `pages/hackathons.js` and `pages/builder-dashboard.js`
- Consolidate verification logic from `VerificationService.js`
- Reuse existing `Card`, `Button`, `Modal` components

#### 3. Incentives & Feedback System
**Status**: Framework exists, needs full implementation

**Existing**:
- `/api/feedback/submit.js` - Feedback submission with taskId
- `/api/feedback/lookup.js` - Admin feedback lookup
- `/api/funding.js` - `approveTesterReward` action
- Project schema with `testerTasks` and `budgetRemainingUSDC`
- `lib/usdcPayments.js` - USDC transfer utilities

**Enhancements Needed**:
- Public tester task board (browse available tasks)
- Task claiming mechanism
- Evidence submission workflow (recordings, screenshots)
- Automated validation where possible
- Reward distribution (USDC, custom tokens, token allocations)
- Reputation/credit score integration
- Leaderboard for top testers

**Components to Create**:
- `components/incentives/TaskBoard.js` - Browse/claim tasks
- `components/incentives/TaskSubmission.js` - Submit evidence
- `components/incentives/RewardHistory.js` - View earnings
- Enhance `pages/feedback.js` to include task discovery

#### 4. Design System
**Status**: Components exist, needs beautiful cohesive design

**Existing**:
- `components/common/` - Comprehensive UI library
- `styles/themes.css` - Theme system
- Tailwind configuration

**Enhancements Needed**:
- Cohesive visual identity aligned with "onchain builder" theme
- Consistent spacing, typography, colors
- Beautiful empty states and illustrations
- Smooth transitions and micro-interactions
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA)

## Source Code Structure Changes

### New Files to Create

```
frontend/src/
├── components/
│   ├── portfolio/
│   │   ├── PortfolioTheme.js           # Portfolio theming system
│   │   ├── FeaturedPortfolios.js       # Homepage featured section
│   │   └── PortfolioAnalytics.js       # View/engagement analytics
│   ├── hackathons/
│   │   ├── HackathonTimeline.js        # Visual timeline component
│   │   ├── ParticipationFlow.js        # Registration/submission wizard
│   │   ├── HackathonCard.js            # Consolidated card component
│   │   └── PrizeAnnouncement.js        # Winner announcement UI
│   ├── incentives/
│   │   ├── TaskBoard.js                # Browse/claim tasks
│   │   ├── TaskCard.js                 # Individual task display
│   │   ├── TaskSubmission.js           # Evidence submission form
│   │   ├── RewardHistory.js            # Earnings history
│   │   └── TesterLeaderboard.js        # Top testers
│   └── design/
│       ├── EmptyStates.js              # Beautiful empty states
│       └── Transitions.js              # Animation utilities
├── pages/
│   ├── tasks/
│   │   ├── index.js                    # Task board page
│   │   └── [taskId].js                 # Individual task detail
│   └── api/
│       ├── tasks/
│       │   ├── index.js                # List/create tasks
│       │   ├── [taskId].js             # Task details/update
│       │   └── [taskId]/claim.js       # Claim task
│       ├── hackathons/
│       │   └── [id]/register.js        # Hackathon registration
│       └── portfolio/
│           └── [username]/analytics.js # Portfolio analytics
└── services/
    └── IncentivesService.js            # Incentives business logic
```

### Files to Modify

**Consolidation targets**:
- `pages/hackathons.js` - Remove duplicate HackathonCard, import from `components/hackathons/`
- `pages/builder-dashboard.js` - Remove duplicate HackathonDashboardCard, use shared component
- `pages/feedback.js` - Enhance with task discovery integration
- `pages/index.js` - Add featured portfolios section
- `pages/u/[username].js` - Add portfolio theming and analytics

**Enhancement targets**:
- `components/projects/ProjectCard.js` - Add portfolio display mode
- `api/projects/[slug].js` - Add testerTasks management
- `api/hackathons/[id].js` - Complete CRUD operations
- `lib/usdcPayments.js` - Add token allocation support

### Files to Remove

**Candidates for removal** (after consolidation):
- Identify and remove any duplicate or unused components
- Remove mock implementations that have been replaced
- Clean up unused utility functions

## Data Model Changes

### Firestore Collections

#### 1. Enhanced `projects` Collection

```typescript
interface Project {
  // Existing fields...
  
  // New fields for incentives
  testerTasks: Array<{
    id: string;
    title: string;
    description: string;
    rewardAmountUSDC: number;
    rewardType: 'usdc' | 'token' | 'credit';
    tokenDetails?: {
      tokenAddress: string;
      tokenAmount: string;
      tokenSymbol: string;
    };
    status: 'open' | 'claimed' | 'submitted' | 'completed' | 'rejected';
    claimedBy?: string;
    claimedAt?: string;
    submittedAt?: string;
    completedAt?: string;
    feedbackId?: string; // Link to feedback submission
    evidenceRequired: string[];
    windowStart?: string;
    windowEnd?: string;
  }>;
  
  budgetRemainingUSDC: number;
  totalBudgetUSDC: number;
  
  // Portfolio enhancements
  featured: boolean;
  featuredAt?: string;
  viewCount: number;
  lastViewedAt: string;
}
```

#### 2. Enhanced `hackathons` Collection

```typescript
interface Hackathon {
  id: string;
  name: string;
  description: string;
  ecosystem: string;
  organizer: string;
  
  // Timeline
  registrationStart: string;
  registrationEnd: string;
  submissionStart: string;
  submissionEnd: string;
  judgingStart: string;
  judgingEnd: string;
  announcementDate: string;
  
  // Prize structure
  prizePool: number;
  prizes: Array<{
    category: string;
    rank: number;
    amount: number;
    winners?: string[]; // User IDs
  }>;
  
  // Tracks/categories
  tracks: string[];
  sponsors: string[];
  
  // Status
  status: 'upcoming' | 'registration' | 'active' | 'judging' | 'completed';
  
  // Integration
  verificationContract?: string;
  feedbackEnabled: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 3. Enhanced `feedback` Collection

```typescript
interface Feedback {
  // Existing fields...
  
  // Link to task
  taskId?: string;
  projectSlug: string;
  
  // Evidence
  evidenceUrls: string[];
  recordingUrl?: string;
  
  // Status
  status: 'pending' | 'accepted' | 'rejected';
  
  // Admin actions
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  // Reward
  rewardAmountUSDC?: number;
  rewardPaid: boolean;
  rewardTxHash?: string;
}
```

#### 4. New `portfolioAnalytics` Collection

```typescript
interface PortfolioAnalytics {
  userId: string;
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
  projectClicks: number;
  referrers: Map<string, number>;
}
```

#### 5. Enhanced `users` Collection

```typescript
interface User {
  // Existing fields...
  
  // Portfolio settings
  portfolioTheme?: 'default' | 'minimal' | 'bold' | 'dark';
  portfolioLayout?: 'grid' | 'list' | 'masonry';
  portfolioPublic: boolean;
  
  // Incentives
  totalEarningsUSDC: number;
  completedTasks: number;
  reputation: number;
  
  // Hackathons
  hackathonsParticipated: number;
  hackathonsWon: number;
}
```

### Firestore Security Rules Updates

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hackathons - public read, admin write
    match /hackathons/{hackathonId} {
      allow read: if true;
      allow write: if isAdminUser();
      
      match /participants/{participantId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update, delete: if isAdminUser() || request.auth.uid == resource.data.userId;
      }
    }
    
    // Portfolio analytics - owner or admin read
    match /portfolioAnalytics/{analyticsId} {
      allow read: if isAdminUser() || 
                     request.auth.uid == resource.data.userId;
      allow write: if false; // Server-side only
    }
    
    // Feedback - authenticated write, public read
    match /feedback/{feedbackId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAdminUser(); // Status changes admin-only
    }
    
    // Projects with task management
    match /projects/{projectId} {
      allow read: if isProjectPublic(projectId) || 
                     isProjectOwner(projectId) || 
                     isAdminUser();
      allow update: if isProjectOwner(projectId) || 
                       isAdminUser();
      allow create, delete: if isAdminUser();
    }
  }
}
```

## API Changes

### New API Endpoints

#### Tasks API
- `GET /api/tasks` - List available tasks (public)
  - Query params: `status`, `ecosystem`, `minReward`, `maxReward`
  - Response: Array of tasks with project info
  
- `GET /api/tasks/[taskId]` - Get task details
  - Response: Full task object with project context
  
- `POST /api/tasks/[taskId]/claim` - Claim a task (authenticated)
  - Request: `{ userId }`
  - Response: Updated task with claimed status
  
- `POST /api/tasks/[taskId]/submit` - Submit task completion (authenticated)
  - Request: `{ feedbackId, evidenceUrls }`
  - Response: Updated task with submitted status

#### Hackathon API Enhancements
- `POST /api/hackathons` - Create hackathon (admin)
- `PUT /api/hackathons/[id]` - Update hackathon (admin)
- `DELETE /api/hackathons/[id]` - Delete hackathon (admin)
- `POST /api/hackathons/[id]/register` - Register for hackathon (authenticated)
- `POST /api/hackathons/[id]/submit` - Submit project to hackathon (authenticated)

#### Portfolio API Enhancements
- `GET /api/portfolio/[username]/analytics` - Get portfolio analytics (owner/admin)
- `POST /api/portfolio/[username]/track-view` - Track portfolio view (public)
- `PUT /api/portfolio/[username]/settings` - Update portfolio settings (owner)

#### Funding API Enhancements
- `POST /api/funding` - Enhanced with `distributeTokenReward` action
  - Support for custom token distributions
  - Request: `{ action: 'distributeTokenReward', taskId, feedbackId, tokenAddress, amount }`

### Modified API Endpoints

**`/api/projects/[slug]`** - Add task management
- `PUT` - Support updating `testerTasks` array
- Validation: Ensure budget sufficiency for new tasks

**`/api/feedback/submit`** - Enhanced task integration
- Link feedback to specific taskId
- Validate task window and evidence requirements

## Interface Changes

### Context Enhancements

#### IncentivesContext (new)
```javascript
const IncentivesContext = {
  availableTasks: Task[],
  myClaimedTasks: Task[],
  myCompletedTasks: Task[],
  totalEarnings: number,
  reputation: number,
  
  claimTask: (taskId: string) => Promise<void>,
  submitTask: (taskId: string, evidenceUrls: string[]) => Promise<void>,
  fetchAvailableTasks: (filters: TaskFilters) => Promise<void>,
  fetchMyTasks: () => Promise<void>
}
```

#### AuthContext Enhancement
```javascript
// Add to existing AuthContext
{
  portfolioSettings: PortfolioSettings,
  updatePortfolioSettings: (settings: Partial<PortfolioSettings>) => Promise<void>
}
```

### Component APIs

#### HackathonTimeline
```javascript
interface HackathonTimelineProps {
  hackathon: Hackathon;
  userParticipation?: Participation;
  compact?: boolean;
}
```

#### TaskBoard
```javascript
interface TaskBoardProps {
  ecosystem?: string;
  minReward?: number;
  maxReward?: number;
  onTaskClaim?: (taskId: string) => void;
}
```

#### PortfolioTheme
```javascript
interface PortfolioThemeProps {
  theme: 'default' | 'minimal' | 'bold' | 'dark';
  layout: 'grid' | 'list' | 'masonry';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}
```

## Design System Guidelines

### Visual Identity
- **Primary Color**: Ocean blue (#0066FF) - representing blockchain/technology
- **Secondary Color**: Vibrant coral (#FF6B6B) - representing building/creation
- **Accent Color**: Electric purple (#8B5CF6) - for highlights and CTAs
- **Neutral Palette**: Gray scale from 50-900

### Typography
- **Headings**: Inter (bold, 700-800 weight)
- **Body**: Inter (regular, 400-500 weight)
- **Code**: JetBrains Mono

### Component Patterns
- **Cards**: Rounded corners (8px), subtle shadows, hover lift effect
- **Buttons**: Primary (filled), Secondary (outlined), Ghost (text only)
- **Forms**: Clear labels, inline validation, helpful error messages
- **Empty States**: Friendly illustrations, clear CTAs, helpful guidance
- **Loading States**: Skeleton screens, spinners with context

### Responsive Breakpoints
- **Mobile**: < 640px (single column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (3+ columns, sidebars)

### Animations
- **Duration**: 150ms (fast), 300ms (medium), 500ms (slow)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Micro-interactions**: Button hover, card lift, input focus

## Verification Approach

### Testing Strategy

#### 1. Unit Tests
- **Services**: Test `IncentivesService.js`, `VerificationService.js`
- **Utils**: Test validation, formatting, data transformations
- **Components**: Test individual component logic
- **Target Coverage**: > 80%

#### 2. Integration Tests
- **API Endpoints**: Test all new/modified endpoints
- **Firebase Interactions**: Test Firestore queries and writes
- **Circle API**: Test USDC transfers and token distributions

#### 3. E2E Tests (Critical Flows)
- **Portfolio Creation**: User creates portfolio → views at subdomain
- **Task Completion**: User claims task → submits evidence → receives reward
- **Hackathon Participation**: User registers → submits project → receives prize
- **Feedback with Incentive**: User submits feedback → admin approves → reward distributed

### Manual Verification Checklist

#### Portfolio System
- [ ] User portfolio displays correctly at subdomain
- [ ] Featured portfolios show on homepage
- [ ] Portfolio customization persists across sessions
- [ ] Analytics track views accurately
- [ ] Responsive on mobile/tablet/desktop

#### Hackathon Tracking
- [ ] Hackathon timeline displays correctly
- [ ] User can register for hackathon
- [ ] User can submit project to hackathon
- [ ] Admin can announce winners
- [ ] Verification flow works end-to-end

#### Incentives System
- [ ] Task board displays available tasks
- [ ] User can claim a task
- [ ] User can submit evidence for task
- [ ] Admin can approve/reject submission
- [ ] USDC reward distributes correctly
- [ ] Token reward distributes correctly (if applicable)
- [ ] Reputation score updates correctly

#### Design Quality
- [ ] Consistent spacing and typography
- [ ] All components follow design system
- [ ] Smooth animations and transitions
- [ ] Beautiful empty states
- [ ] Clear error messages
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Mobile-optimized (touch targets, responsive)

### Lint and Type Check

Run before completion:
```bash
npm run lint           # ESLint checks
npm run build          # Next.js build (includes type checks)
```

### Performance Checks

- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size < 300KB (main bundle)

## Implementation Phases

### Phase 1: Consolidation & Enhancement (Week 1)
1. Audit existing components for duplication
2. Consolidate hackathon cards into shared component
3. Enhance portfolio system with theming
4. Add featured portfolios to homepage
5. Implement portfolio analytics tracking

### Phase 2: Hackathon System Completion (Week 2)
1. Complete hackathon CRUD APIs
2. Build registration and submission flow
3. Implement timeline visualization
4. Create winner announcement UI
5. Integrate with verification system

### Phase 3: Incentives System (Week 3)
1. Create task board and task cards
2. Implement claim and submission flow
3. Build evidence validation
4. Enhance admin approval interface
5. Implement reward distribution (USDC)
6. Add token reward support (optional)

### Phase 4: Design Polish & Testing (Week 4)
1. Apply design system consistently
2. Create beautiful empty states
3. Add animations and transitions
4. Implement comprehensive testing
5. Performance optimization
6. Mobile optimization
7. Accessibility improvements

## Risk Assessment

### High Risk
- **Token distribution complexity**: Custom token transfers may require additional smart contract work
  - Mitigation: Start with USDC only, add token support later
  
- **Performance with many tasks**: Task board may be slow with hundreds of tasks
  - Mitigation: Implement pagination, filtering, caching

### Medium Risk
- **Subdomain routing in production**: May require DNS configuration
  - Mitigation: Document deployment process, test in staging
  
- **Circle API rate limits**: High transaction volume may hit limits
  - Mitigation: Implement queuing, batch processing

### Low Risk
- **Design consistency**: Large codebase may have inconsistent patterns
  - Mitigation: Create comprehensive design system, regular audits

## Success Criteria

1. **Functional Completeness**
   - All portfolio features working (subdomain, customization, analytics)
   - Full hackathon lifecycle supported (register → submit → win)
   - Complete incentive flow (claim → submit → reward)

2. **Code Quality**
   - No duplicate components or logic
   - All core principles followed (ENHANCEMENT FIRST, DRY, CLEAN, etc.)
   - Test coverage > 80%
   - Lint and build pass without errors

3. **Design Quality**
   - Consistent visual identity across all pages
   - Beautiful, intuitive UI
   - Smooth animations and interactions
   - Mobile-optimized and accessible

4. **Performance**
   - Lighthouse score > 90
   - Fast page loads (< 2s)
   - No runtime errors or console warnings

5. **Documentation**
   - Clear code comments
   - Updated API documentation
   - Deployment guide updated
