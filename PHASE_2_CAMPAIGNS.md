# Phase 2: Testing Campaign System — BUILD PROGRESS

**Status**: Foundation Design Complete ✅  
**Timeline**: Weeks 3-5  
**Goal**: Enable developers to create testing campaigns and testers to submit results with quality scoring

## System Architecture

### Data Flow
```
Developer creates campaign 
    → Firestore: TestingCampaigns collection
    → Published in discovery page
    → Testers browse and apply
    → Testers submit results
    → Admin approves/rejects
    → Rewards distributed (Phase 3)
```

### Core Collections

#### TestingCampaigns (Main)
```javascript
{
  id: string,                          // Unique ID
  projectId: string,                   // Parent project
  creatorId: string,                   // Developer UID
  title: string,                       // Campaign name (5-100 chars)
  description: string,                 // Full description (20-2000 chars)
  status: enum,                        // draft | open | closed | review | approved | rejected
  deadline: timestamp,                 // Submission deadline (ISO date)
  
  // Budget & Rewards
  budget: {
    total: number,                     // Total allocation (USDC)
    perSubmission: number,             // Reward per approved submission
    currency: string,                  // USDC (default)
    tokenAllocation: number,           // % of reward as token equity
  },
  
  // Test Definition
  requirements: [                      // What to test
    { title, description, priority }   // low | medium | high
  ],
  testScenarios: [                     // How to test
    {
      id: string,
      title: string,
      description: string,
      steps: string[],                 // Step-by-step instructions
      expectedResult: string,          // What should happen
    }
  ],
  expectedOutcome: string,             // Success criteria
  successMetrics: [                    // How to measure
    { name, target }
  ],
  
  // Eligibility
  maxSubmissions: number,              // Limit (default: 50)
  eligibility: {
    minLevel: enum,                    // beginner | intermediate | expert
    requiredExperience: string,        // e.g., "3+ years Solidity"
    geographicRestrictions: string[],  // Country codes to exclude
  },
  
  // Stats
  stats: {
    totalSubmissions: number,
    approvedSubmissions: number,
    averageRating: number,            // 1-5 stars
  },
  
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

#### CampaignSubmissions (Results)
```javascript
{
  id: string,                          // Unique ID
  campaignId: string,                  // Parent campaign FK
  testerId: string,                    // Submitter UID
  
  // Test Results
  results: {
    scenarioResults: [                 // Results per scenario
      {
        scenarioId: string,
        passed: boolean,
        notes: string,
      }
    ],
    overallRating: number,             // 1-5 stars
    feedback: string,                  // Detailed feedback
    evidence: [                        // Proof of testing
      {
        type: enum,                    // screenshot | video | log | other
        url: string,                   // File URL
        description: string,
      }
    ],
    bugsSeverity: [                    // Bugs found
      {
        severity: enum,                // critical | high | medium | low
        description: string,
      }
    ],
  },
  
  status: enum,                        // draft | submitted | approved | rejected
  submittedAt: timestamp,
  approvalNotes: string,               // Admin feedback
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

#### CampaignApplications (Registry)
```javascript
{
  id: string,
  campaignId: string,
  testerId: string,
  status: enum,                        // applied | accepted | rejected | withdrawn
  appliedAt: timestamp,
  respondedAt: timestamp,
}
```

## Firestore Rules (Security)

```firestore
match /TestingCampaigns/{campaignId} {
  allow read: if true;                 // Public discovery
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.creatorId;
  allow delete: if request.auth.uid == resource.data.creatorId;
}

match /CampaignSubmissions/{submissionId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.testerId || isAdmin();
  allow delete: if false;              // Immutable
}

match /CampaignApplications/{appId} {
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.testerId || isAdmin();
}
```

## Validation Schema

All data flows through `frontend/src/schemas/campaign.js`:
- `validateCampaign()` — Campaign creation/update
- `validateCampaignSubmission()` — Submission validation
- `sanitizeCampaign()` — Safe data normalization
- `sanitizeSubmission()` — Safe submission normalization

## Components to Build

### Developer Side (Campaign Creator)

#### 1. `/frontend/src/components/campaigns/CampaignForm.js`
- Multi-step form (5 sections)
- Draft saving to localStorage
- Validation on each step
- Character limits with counters

**Steps**:
1. Basic Info (title, description, project)
2. Budget & Timeline (USDC, token %, deadline)
3. Test Requirements (list of what to test)
4. Test Scenarios (detailed step-by-step tests)
5. Success Metrics & Eligibility

#### 2. `/frontend/src/components/campaigns/CampaignEditor.js`
- Edit existing campaigns (if status === 'draft')
- Publish to 'open' status
- View responses

#### 3. `/frontend/src/pages/campaigns/new.js`
- Route: `/campaigns/new`
- Use CampaignForm component
- On save: Create document in TestingCampaigns
- Redirect to edit page

#### 4. `/frontend/src/pages/campaigns/[id]/edit.js`
- Route: `/campaigns/[id]/edit`
- Show CampaignEditor
- Allow edit until published

### Tester Side (Campaign Discovery & Submission)

#### 1. `/frontend/src/components/campaigns/CampaignCard.js`
- Display campaign summary
- Budget, deadline, difficulty badge
- Link to detail page
- "Apply Now" button

#### 2. `/frontend/src/components/campaigns/CampaignDetail.js`
- Full campaign details
- Requirements list
- Test scenarios with steps
- Budget/rewards info
- "Apply" or "Submit Results" button

#### 3. `/frontend/src/components/campaigns/SubmissionForm.js`
- Multi-step form (3 sections)
- Required for each test scenario
- File upload for evidence (screenshots, logs)
- 1-5 star rating
- Bug report section

**Steps**:
1. Test Results (pass/fail per scenario, notes)
2. Overall Feedback (rating, comments, bugs found)
3. Evidence (screenshots, logs, video link)

#### 4. `/frontend/src/pages/campaigns.js`
- Route: `/campaigns` (discovery page)
- Show all open campaigns
- Filter by: chain, sector, difficulty
- Sort by: deadline, reward, popularity
- Search by title/description

#### 5. `/frontend/src/pages/campaigns/[id].js`
- Route: `/campaigns/[id]`
- Show CampaignDetail
- Show submission history
- Status: Applied | Pending | Submitted | Approved

### Admin Side (Approval)

#### 1. `/frontend/src/components/admin/SubmissionReview.js`
- Show all submissions for a campaign
- Review rating, feedback, evidence
- Approve/Reject buttons
- Add admin notes

#### 2. `/frontend/src/pages/admin/campaigns.js`
- Route: `/admin/campaigns`
- List of campaigns pending approval
- Submission count per campaign
- Quick actions

## Database Hooks (Frontend)

Create in `/frontend/src/hooks/`:

#### `useCampaigns.js`
- `getCampaigns(filters)` — List with filters
- `getCampaign(id)` — Single campaign
- `createCampaign(data)` — Save new campaign
- `updateCampaign(id, data)` — Update campaign
- `publishCampaign(id)` — Change status to 'open'

#### `useCampaignSubmissions.js`
- `getSubmission(id)` — Get single submission
- `getSubmissionsByCampaign(campaignId)` — All submissions for campaign
- `getSubmissionsByTester(testerId)` — Tester's submissions
- `createSubmission(data)` — Save submission (draft)
- `submitSubmission(id)` — Change status to 'submitted'
- `approveSubmission(id, notes)` — Admin approve
- `rejectSubmission(id, notes)` — Admin reject

#### `useCampaignApplications.js`
- `applyToCampaign(campaignId)` — Record application
- `getMyApplications()` — Tester's applications
- `getApplicationsByCampaign(campaignId)` — Campaign applicants

## Integration Points

1. **Project Detail Page** — "Create Campaign" button
2. **Developer Dashboard** — List active campaigns, submissions pending
3. **Navigation** — Add "/campaigns" link
4. **User Profile** — Show testing history, badges earned
5. **Admin Dashboard** — Submissions pending approval

## Success Criteria (Phase 2 Complete When)

- ✅ Campaign creation form fully functional
- ✅ Campaign discovery page with filters
- ✅ Submission form with evidence upload
- ✅ Admin approval workflow
- ✅ All data persists in Firestore
- ✅ Mobile responsive (tested iOS + Android)
- ✅ Dark mode working
- ✅ Validation errors shown clearly
- ✅ Draft auto-save works
- ✅ Tests written (Jest)

## File Structure (New)

```
frontend/src/
├── schemas/
│   └── campaign.js                    ← Created ✅
├── components/campaigns/
│   ├── CampaignForm.js                ← To create
│   ├── CampaignEditor.js              ← To create
│   ├── CampaignCard.js                ← To create
│   ├── CampaignDetail.js              ← To create
│   ├── SubmissionForm.js              ← To create
│   └── index.js
├── components/admin/
│   └── SubmissionReview.js            ← To create
├── hooks/
│   ├── useCampaigns.js                ← To create
│   ├── useCampaignSubmissions.js       ← To create
│   └── useCampaignApplications.js      ← To create
└── pages/
    ├── campaigns/
    │   ├── new.js                     ← To create
    │   ├── [id].js                    ← To create
    │   └── [id]/edit.js               ← To create
    ├── campaigns.js                   ← To create
    └── admin/campaigns.js             ← To create
```

## Next Steps (Priority Order)

1. **Create CampaignForm** (Developer side campaign creation)
2. **Create CampaignCard & Discovery page** (Tester side browsing)
3. **Create SubmissionForm** (Tester side results)
4. **Integrate hooks** (Connect to Firestore)
5. **Admin review interface** (Approval workflow)
6. **Testing & mobile optimization**

---

**Timeline**: Weeks 3-5 (foundation complete)  
**Next**: Phase 3 (Weeks 5-7) — Token Allocation & Equity
