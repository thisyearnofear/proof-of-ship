# Ethos Network Integration

## Overview
This integration adds **Ethos Network credibility scores** to the proof-of-ship platform, bringing reputation-based trust signals to builder portfolios, projects, and feedback.

Built for the **Vibeathon Hackathon** - Reputation-Driven Improvement Track.

## What's Been Integrated

### 1. Core Service Layer
- **`frontend/src/services/EthosService.js`**
  - Fetches credibility scores from Ethos API (`https://api.ethos.network/api/v2`)
  - In-memory caching (5-minute TTL) to minimize API calls
  - Graceful error handling for users not on Ethos
  - Score tier classification (Excellent, Good, Neutral, Questionable, Untrustworthy)

### 2. Reusable Components
- **`frontend/src/components/ethos/EthosScoreBadge.js`**
  - Displays credibility score with color-coded badges
  - Shows tier label (e.g., "1850 • Good")
  - Tooltip with score ranges and user stats
  
- **`frontend/src/components/ethos/EthosProfileLink.js`**
  - Links to full Ethos profile on app.ethos.network
  - External link icon for clarity

### 3. Integration Points

#### User Profile Page
**File:** `frontend/src/components/Auth/UserProfile.js`
- Shows logged-in user's Ethos credibility score
- Link to view detailed Ethos profile
- Updates when wallet address is saved

#### Portfolio Page
**File:** `frontend/src/pages/u/[username].js`
- Displays builder's credibility score next to their name
- Visual trust indicator (color-coded badge)
- Link to Ethos profile in metadata section

#### Project Detail Page
**File:** `frontend/src/pages/projects/[ecosystem]/[slug]/index.js`
- Shows project owner's credibility score
- Helps users assess project creator trustworthiness

### 4. API Enhancements
- **`frontend/src/pages/api/portfolio/[username].js`**
  - Now includes `walletAddress` in response
  
- **`frontend/src/services/EnhancedDataService.js`**
  - `getProject()` now includes `ownerWalletAddress` for Ethos lookups

## How It Works

### Data Flow
1. **User wallet address** stored in Firestore (`users/{uid}/walletAddress`)
2. **EthosService** fetches score when pages load
3. **Score cached** in memory to avoid redundant API calls
4. **Visual components** render score with trust indicators

### Score Interpretation
Based on Ethos Network's scoring system:
- **2000-2800**: Excellent (green)
- **1600-1999**: Good (blue)
- **1200-1599**: Neutral (gray)
- **800-1199**: Questionable (orange)
- **0-799**: Untrustworthy (red)
- **No score**: "New to Ethos" (gray)

### API Details
- **Base URL:** `https://api.ethos.network/api/v2`
- **Endpoint:** `POST /users/by/address`
- **Required Header:** `X-Ethos-Client: proof-of-ship@1.0.0`
- **Authentication:** Not required for public score queries

## User Journey Impact

### Before Ethos Integration
- Builders' portfolios show projects but no trust signals
- Users must manually research builder credibility
- No way to assess feedback quality from testers

### After Ethos Integration
- **High-reputation builders** get immediate trust signals
- **Questionable actors** visibly marked with lower scores
- **Feedback credibility** can be weighted by tester reputation
- **Discovery improved** - users can quickly identify trustworthy builders

## Demo Points for Vibeathon Submission

1. **Portfolio View**
   - Navigate to `/u/{username}` to see builder credibility
   - High score builders prominently display trust badge
   
2. **Project Detail**
   - View any project to see owner's Ethos score
   - Score affects perceived project credibility
   
3. **Profile Management**
   - Users can link wallet address
   - Ethos score automatically fetched and displayed

4. **Reputation-Driven Discovery**
   - Compare portfolios with different score levels
   - Demonstrate how reputation changes trust decisions

## Technical Implementation

### Key Files Created
```
frontend/src/services/EthosService.js
frontend/src/components/ethos/EthosScoreBadge.js
frontend/src/components/ethos/EthosProfileLink.js
frontend/src/components/ethos/index.js
```

### Key Files Modified
```
frontend/src/components/Auth/UserProfile.js
frontend/src/pages/u/[username].js
frontend/src/pages/projects/[ecosystem]/[slug]/index.js
frontend/src/pages/api/portfolio/[username].js
frontend/src/services/EnhancedDataService.js
```

## Future Enhancements (Out of Scope for Hackathon)

- **Write Reviews** - Allow users to write reviews to Ethos from platform
- **Vouch Mechanism** - Enable staking ETH to vouch for builders
- **Score-Based Filtering** - Filter/sort projects by owner reputation
- **Historical Tracking** - Track reputation changes over time
- **Tester Credibility** - Weight feedback by tester Ethos scores

## Testing

To test the integration:

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Add a wallet address:**
   - Log in with GitHub
   - Navigate to `/profile`
   - Add a valid Ethereum wallet address
   - Save and observe Ethos score loading

3. **View portfolios:**
   - Navigate to `/u/{username}` for users with wallet addresses
   - Observe credibility scores displayed

4. **Test with known Ethos addresses:**
   - Use addresses from active Ethos users
   - Verify scores display correctly
   - Check tooltip information

## Credits

- **Ethos Network API:** https://developers.ethos.network
- **Built for:** Vibeathon Hackathon (Reputation-Driven Improvement Track)
- **Integration Date:** January 2026
