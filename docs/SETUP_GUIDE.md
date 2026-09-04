# PledgeBond — Setup Guide

Get started with the platform in minutes.

## Quick Start

1. **Visit** [pledgebond.com](https://pledgebond.com)
2. **Connect** your wallet (MetaMask, Phantom, or Solflare)
3. **Explore** projects on the **Explore** page
4. **Back** projects on the **Back** page

## Firebase Setup

The app uses Firebase for Auth, Firestore, and Cloud Storage. Vercel handles the frontend and API routes, but Firebase remains the backend data layer.

### Should you rename the old project or create a new one?

Firebase project IDs cannot be renamed — only the display name can change. Because the codebase already expects a project ID of `pledgebond` (`.firebaserc`, `frontend/src/config/publicConfig.js`, `.env.example`), the clean path is to create a new Firebase project with that ID. If `pledgebond` is already taken, pick `pledgebond-app` (or similar) and update those three files to match.

### Recommended plan

Use the **Blaze** (pay-as-you-go) plan, not Spark, because:

- Cloud Storage for Firebase requires Blaze as of September 2024. On Spark, Storage requests return 402/403 errors.
- Blaze still includes the same no-cost usage quotas; you only pay if you exceed them.
- Spark Auth is limited to 3,000 Daily Active Users. Blaze gives you 50,000 Monthly Active Users before charges.
- Firestore no-cost limits on Blaze are the same as Spark: 1 GiB stored, 50k reads/day, 20k writes/day, 20k deletes/day, 10 GiB egress/month.

For an early-stage / hackathon-scale product, you will likely pay $0 on Blaze while removing the Spark restrictions.

### Create the project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project named `PledgeBond` with project ID `pledgebond`.
2. Enable **Authentication** (Email/Password and any social providers you want) and **Firestore Database**.
3. Enable **Storage**; choose a default bucket in `us-central1`, `us-east1`, or `us-west1` for the best no-cost quota.
4. Copy `.env.example` to `frontend/.env.local` and fill in the Firebase values from Project Settings.
5. Deploy Firestore rules and indexes:
   ```bash
   # If you have the Firebase CLI installed
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```
   If the CLI is not installed, install it with `npm install -g firebase-tools` or `pnpm add -g firebase-tools` and run `firebase login` first.
6. Run `scripts/sync-secrets.sh` to push sensitive values to Vercel / GCP Secret Manager if used.

### Migration from the old project

- **Dev / preview environments:** create a fresh `pledgebond` project and re-seed with `scripts/`.
- **Production:** export Firestore collections from the old project and import them into the new one, or keep the old project and only switch the app config if you cannot migrate data.

## Setting Up Your Payment Wallet

To use AI agents (Scout, Underwriter, Verifier), you need a payment wallet with USDC on Arc.

### Get USDC on Arc Testnet

1. Visit the [Arc Faucet](https://www.circle.com/en/USDC)
2. Or use the in-app chat assistant for test-faucet guidance

### Set Up Your Wallet

1. Go to **Back → Economy**
2. Click **"Set up payment wallet"**
3. Follow the prompts to deposit USDC
4. Verify your balance is showing

### Test Mode (Optional)

For testing without real payments, enable test mode in the Economy tab toggle.
Test mode skips payment verification and marks responses as `test_mode`.
Requires `ALLOW_DEMO_PAYMENTS=true` on the server (never enabled in production).

## Using AI Agents

### Scout Agent (0.01 USDC)

Finds the best projects across all ecosystems.

1. Go to **Back → Economy**
2. Click **Run Scout**
3. Review the top projects and scores

### Underwriter Agent (0.05 USDC)

Analyzes a specific project in depth.

1. Go to **Back → Discover**
2. Find a project you like
3. Click **Analyze** → **Run Underwriter**
4. Review the health score and breakdown

### Verifier Agent (0.01 USDC)

Checks code quality and security.

1. Open any project detail page
2. Click **Verify** in the AI Agents section
3. Review the verification report

## Understanding Results

Each agent returns:

- **status**: `ok`, `fallback`, or `error`
- **resultSource**: Where the result came from:
  - `live_ai` — real AI analysis
  - `cached` — previous result (faster)
  - `rule_based` — scoring algorithm
  - `fallback` — degraded output
- **nextAction**: Suggested next step
- **agentInfo**: Payment details and tx hash
- **agentInfo.paymentStatus**: `verified`, `test_mode`, `degraded`, or `unverified`

## Troubleshooting

### "Payment Required" Error

- **Deposit USDC** in your payment wallet on the Economy tab
- Or enable **test mode** in the Economy tab toggle (requires server-side `ALLOW_DEMO_PAYMENTS=true`)

### "Project Not Found"

- The project may have been removed
- Try searching on the **Explore** page

### Wallet Connection Issues

- Clear browser cache
- Try a different wallet extension
- Make sure you're on the right network (Arc for mainnet)

## Need Help?

- Use the in-app chat assistant (free guide mode)
- Open an issue on GitHub