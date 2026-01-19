# Vibeathon Demo Script - Ethos Integration

## Demo Duration: 2-3 minutes

---

## Opening (15 seconds)
**Voiceover:**
> "proof-of-ship is a platform for builders to showcase their onchain projects and get feedback from testers. But there's a trust problem: how do you know which builders are credible? Which feedback is trustworthy?"

**Screen:**
- Show portfolio page WITHOUT Ethos scores (before screenshot)
- Highlight the lack of trust signals

---

## Problem Statement (15 seconds)
**Voiceover:**
> "Without reputation signals, users can't quickly assess:
> - Is this builder legitimate?
> - Should I trust their projects?
> - Is this tester's feedback valuable?"

**Screen:**
- Show 3 different portfolios
- Question marks on screen emphasizing uncertainty

---

## Solution: Ethos Integration (30 seconds)
**Voiceover:**
> "We've integrated Ethos Network - a blockchain-native reputation system - to bring trust signals directly into the user journey."

**Screen:**
- Show Ethos logo
- Quick animation of data flow: Wallet → Ethos API → proof-of-ship

**Key Points to Display:**
- ✓ Real-time credibility scores
- ✓ On-chain reputation data
- ✓ Color-coded trust indicators

---

## Demo Flow (90 seconds)

### 1. Portfolio View (30 seconds)
**Voiceover:**
> "Here's a builder's portfolio. Notice the Ethos credibility score right next to their name - a score of 1850 means 'Good' reputation. This builder has received positive reviews and vouches from the community."

**Screen Actions:**
1. Navigate to `/u/{high-score-builder}`
2. **Highlight:**
   - Green/blue badge showing "1850 • Good"
   - Hover over badge to show tooltip with details
   - Click "Ethos Profile" link (opens in new tab briefly)

**Voiceover:**
> "Compare this to a builder with no reputation history..."

3. Navigate to `/u/{no-score-builder}`
4. **Show:** "New to Ethos" badge in gray
5. **Emphasize:** The visual difference in trust signals

---

### 2. Project Detail View (30 seconds)
**Voiceover:**
> "When viewing a project, you can immediately see the owner's credibility. This project is submitted by someone with excellent reputation - a score above 2000."

**Screen Actions:**
1. Click into a project from high-score builder
2. **Highlight:**
   - Project owner section showing Ethos badge
   - Excellent (green) trust indicator

**Voiceover:**
> "This reputation layer helps you decide whether to test, fund, or collaborate on a project."

---

### 3. User Profile (30 seconds)
**Voiceover:**
> "As a builder, you can connect your wallet address to display your Ethos score. Let's see this in action..."

**Screen Actions:**
1. Navigate to `/profile`
2. **Show existing user with wallet:**
   - Ethos score displayed below profile info
   - "View Details" link

**Voiceover:**
> "Your reputation follows you across the platform - in your portfolio, on your projects, even when you leave feedback. High credibility builders get immediate trust signals, making it easier to attract testers and collaborators."

---

## Impact Summary (20 seconds)
**Voiceover:**
> "With Ethos integration, proof-of-ship now offers:
> - Instant trust verification for builders
> - Reputation-weighted feedback credibility  
> - Safer discovery and collaboration"

**Screen:**
- Split screen showing before/after
- Key metrics on screen:
  - ✓ 3 integration points
  - ✓ Color-coded trust tiers
  - ✓ Real-time API updates

---

## Closing (10 seconds)
**Voiceover:**
> "Reputation as a layer for Web3 platforms - building trust, one score at a time. Built for Vibeathon with Ethos Network."

**Screen:**
- Logo animation
- Links:
  - GitHub repo
  - Ethos.network
  - Live demo link

---

## Technical Talking Points (For Q&A)

### What We Built:
- **Service layer** for Ethos API integration
- **Reusable components** for score display
- **3 key integration points:** Profile, Portfolio, Project pages
- **Smart caching** to minimize API calls (5-min TTL)

### Why This Matters:
- **Solves trust gap** in Web3 builder platforms
- **Lightweight integration** - no major refactoring needed
- **Enhances existing UX** with reputation signals
- **Extensible** - can add review/vouch features later

### Technical Choices:
- Read-only integration (appropriate for 72-hour hackathon)
- Client-side + API route architecture
- Graceful degradation (works without Ethos data)
- Follows existing service pattern in codebase

---

## Demo Tips

### Preparation:
1. Have 2-3 test accounts ready:
   - One with high Ethos score
   - One with low/no score
   - One new user
2. Seed some projects with different owner reputations
3. Record in HD (1080p minimum)
4. Use smooth screen transitions
5. Highlight UI elements with cursor/annotations

### Visuals:
- Use zoom-in effects for important UI elements
- Add animated arrows pointing to Ethos badges
- Use side-by-side comparisons
- Keep text on screen large and readable

### Audio:
- Clear voiceover (consider professional VO if budget allows)
- Background music (subtle, not distracting)
- Sound effects for transitions

---

## Backup Points (If Time Allows)

### Future Vision:
- "In the future, we could enable writing reviews from proof-of-ship directly to Ethos"
- "Imagine vouching for builders with staked ETH right from their portfolio"
- "Score-based filtering could surface the most reputable projects first"

### Technical Deep Dive:
- Show the EthosService code briefly
- Demonstrate the API call in network inspector
- Show how caching reduces redundant requests

---

## Call to Action

**End Screen:**
- **Try it live:** [demo-link]
- **GitHub:** github.com/[your-repo]
- **Ethos Network:** ethos.network
- **Built with:** Claude, Next.js, Firebase, Ethos API

**QR Codes** for easy mobile access
