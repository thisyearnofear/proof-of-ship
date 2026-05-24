# API Routes

All routes are BFF (Backend-for-Frontend) wrappers under `frontend/src/pages/api/`. Business logic lives in `services/`.

## Agent (`/api/agent/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/chat` | POST | AI chat via Featherless/AIsa cascade |
| `/analyze` | POST | Analyze a project |
| `/scout` | POST | Scout agent analysis |
| `/underwrite` | POST | Underwriter agent analysis |
| `/verify` | POST | Verify milestone completion |
| `/payout-verify` | POST | Verify payout conditions |
| `/execute` | POST | Execute on-chain agent action (Circle contract tx) |
| `/stream` | GET | SSE event stream for live agent activity |

## Circle (`/api/circle/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/config` | GET | Circle W3S configuration + supported tokens/chains |
| `/status` | GET | Circle API health check + ping |
| `/wallets` | GET | List wallets (optional `?walletSetId=`) |
| `/wallets` | POST | Create developer wallet |
| `/wallets/[id]` | GET | Single wallet details |
| `/wallets/[id]/balances` | GET | Token balances for a wallet |
| `/transactions` | GET | Transaction status (`?id=txId`) |
| `/transactions` | POST | Create transaction (transfer or contract call) |
| `/transfer` | POST | USDC payout to tester (with auth) |
| `/webhook` | POST | Circle push notification (HMAC-SHA256 verified) |

## Projects (`/api/projects/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/submit` | POST | Submit a new project |
| `/import-github` | POST | Auto-populate from GitHub repo |
| `/log` | POST | Log project activity |
| `/[slug]` | GET | Single project details |
| `/winding-down` | GET | Projects nearing wind-down |

## Hackathons (`/api/hackathons/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | List hackathons |
| `/[id]` | GET | Hackathon details |
| `/[id]/participants` | GET | Hackathon participants |
| `/[id]/payout-timeline` | GET | Payout schedule |
| `/leaderboard` | GET | Leaderboard scores |

## Verification (`/api/verification/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/hackathon` | POST | Submit hackathon verification |
| `/funding` | POST | Submit funding verification |
| `/weft-callback` | POST | Weft oracle callback |

## Winner Verification (`/api/winner-verification/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/status` | GET | Verification status |
| `/claim` | POST | Claim hackathon prize |

## Scoring & Reputation

| Route | Method | Purpose |
|-------|--------|---------|
| `/credit/score` | GET | Builder credit score |
| `/score/preview` | GET | Score preview (public) |
| `/reputation/score` | GET | Reputation score |

## Bags / Torque

| Route | Method | Purpose |
|-------|--------|---------|
| `/bags/market` | GET | Bags token market data |
| `/torque/leaderboard` | GET | Torque leaderboard |
| `/torque/incentives` | GET | Torque incentive data |
| `/torque/events` | GET | Torque event log |

## Other

| Route | Method | Purpose |
|-------|--------|---------|
| `/activity/feed` | GET | Live activity feed |
| `/builders` | GET | Builder directory |
| `/follows` | POST | Follow/unfollow a builder |
| `/platform/stats` | GET | Platform-wide stats |
| `/portfolio/[username]` | GET | Builder portfolio |
| `/nebula` | GET | Nebula API proxy |
| `/og/*` | GET | Open Graph images (project, celebration, scout) |
| `/lifi/chains` | GET | LI.FI supported chains |
| `/cloak/status` | GET | Cloak privacy status |
| `/admin/winner-claims` | GET | Admin: winner claims |
| `/feedback/submit` | POST | Submit feedback |
| `/feedback/lookup` | GET | Lookup feedback by ID |
| `/hello` | GET | Health check |
