#!/bin/bash
#
# sync-secrets.sh — Pull secrets from GCP Secret Manager and set them as
# Vercel environment variables for the proof-of-ship project.
#
# Prerequisites:
#   - gcloud CLI authenticated with access to proofofship project
#   - Vercel CLI installed and linked to the project
#   - GCP Secret Manager API enabled
#
# Usage:
#   ./scripts/sync-secrets.sh              # sync all secrets
#   ./scripts/sync-secrets.sh --dry-run    # show what would be synced
#
# Secrets are mapped: GCP secret name → Vercel env var name
# New secrets can be added to the SECRETS_MAP below.

set -euo pipefail

GCP_PROJECT="proofofship"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN — no changes will be made ==="
fi

# Map: gcp-secret-name → VERCEL_ENV_VAR_NAME
declare -A SECRETS_MAP=(
  ["circle-api-key"]="CIRCLE_API_KEY"
  ["circle-entity-secret"]="CIRCLE_ENTITY_SECRET"
  ["circle-wallet-set-id"]="CIRCLE_WALLET_SET_ID"
  ["circle-webhook-secret"]="CIRCLE_WEBHOOK_SECRET"
  ["circle-platform-wallet-id"]="CIRCLE_PLATFORM_WALLET_ID"
  ["circle-agent-wallet-id"]="CIRCLE_AGENT_WALLET_ID"
  ["firebase-private-key"]="FIREBASE_PRIVATE_KEY"
  ["firebase-client-email"]="FIREBASE_CLIENT_EMAIL"
  ["github-token"]="GITHUB_TOKEN"
  ["agent-api-key"]="AGENT_API_KEY"
  ["featherless-api-key"]="FEATHERLESS_API_KEY"
)

# Non-secret env vars that should also be set
declare -A CONFIG_MAP=(
  ["FIREBASE_PROJECT_ID"]="proofofship"
  ["CIRCLE_ENVIRONMENT"]="sandbox"
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]="proofofship"
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"]="proofofship.firebaseapp.com"
  ["NEXT_PUBLIC_SOLANA_CLUSTER"]="devnet"
  ["NEXT_PUBLIC_SOLANA_PROGRAM_ID"]="DVzV16mVG9vHdrum9Fx9kGhzRv2GJa2mNnmTWUnKa6st"
  ["BUILDER_CREDIT_ARC_ADDRESS"]="0x26272b687df2c3607aCa3B6116c24B7400c3fC94"
  ["ALLOW_DEMO_PAYMENTS"]="false"
)

echo ""
echo "Syncing secrets from GCP Secret Manager → Vercel..."
echo "Project: $GCP_PROJECT"
echo ""

# Sync secrets
for gcp_name in "${!SECRETS_MAP[@]}"; do
  vercel_name="${SECRETS_MAP[$gcp_name]}"

  # Read the latest version from Secret Manager
  value=$(gcloud secrets versions access latest \
    --secret="$gcp_name" \
    --project="$GCP_PROJECT" 2>/dev/null || echo "")

  if [[ -z "$value" ]]; then
    echo "  SKIP  $gcp_name → $vercel_name (secret not populated yet)"
    continue
  fi

  if $DRY_RUN; then
    echo "  WOULD SET $vercel_name (from $gcp_name)"
  else
    # Remove existing value first (ignore errors if not set)
    vercel env rm "$vercel_name" production 2>/dev/null || true
    # Set new value
    echo "$value" | vercel env add "$vercel_name" production 2>/dev/null
    echo "  OK    $vercel_name ← $gcp_name"
  fi
done

echo ""

# Sync non-secret config
for var_name in "${!CONFIG_MAP[@]}"; do
  var_value="${CONFIG_MAP[$var_name]}"

  if $DRY_RUN; then
    echo "  WOULD SET $var_name=$var_value"
  else
    vercel env rm "$var_name" production 2>/dev/null || true
    echo "$var_value" | vercel env add "$var_name" production 2>/dev/null
    echo "  OK    $var_name=$var_value"
  fi
done

echo ""
echo "Done. Redeploy with: vercel --prod"
