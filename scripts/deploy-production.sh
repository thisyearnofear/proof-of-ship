#!/bin/bash

# Production Deployment Script for Firebase
# This script safely loads environment variables and deploys to Firebase

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production environment variables."
    exit 1
fi

# Load environment variables from .env.production
echo "📋 Loading production environment variables..."
export $(grep -v '^#' .env.production | xargs)

# Validate required Circle API variables
if [ -z "$CIRCLE_API_KEY" ] || [ "$CIRCLE_API_KEY" = "your_real_circle_api_key" ]; then
    echo "⚠️  Warning: CIRCLE_API_KEY not set or still using placeholder value"
    echo "The app will work but USDC payments will fail without real Circle API credentials"
fi

if [ -z "$CIRCLE_PLATFORM_WALLET_ID" ] || [ "$CIRCLE_PLATFORM_WALLET_ID" = "your_platform_wallet_id_here" ]; then
    echo "⚠️  Warning: CIRCLE_PLATFORM_WALLET_ID not set or still using placeholder value"
fi

# Build the application
echo "🔨 Building application for production..."
npm run build:production

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be live at: https://proofofship.web.app"
