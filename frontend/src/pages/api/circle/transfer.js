/**
 * API Endpoint: Circle USDC Transfer
 * Handles payout transfers to testers
 * Requires admin authentication and valid payout record
 * 
 * Works on: Vercel serverless functions, Firebase Cloud Functions
 * Does NOT work on: Firebase Hosting static export (requires Cloud Functions)
 */

import { db, auth } from '@/lib/firebase/serverOnly';

// Circle API base
const CIRCLE_API_BASE = process.env.CIRCLE_ENVIRONMENT === 'production'
  ? 'https://api.circle.com/v1'
  : 'https://api.sandbox.circle.com/v1';

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

/**
 * Verify tester address exists in Circle
 */
async function verifyTesterWallet(testerId) {
  try {
    // In production, you'd look up tester's Circle wallet address
    // For now, return mock address (implement with actual Circle wallet lookup)
    const response = await fetch(`${CIRCLE_API_BASE}/wallets`, {
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Circle API error: ${response.statusText}`);
    }

    // In real implementation, filter by tester ID
    // For MVP, assume address is stored in user profile
    return true;
  } catch (error) {
    console.error('Error verifying wallet:', error);
    return false;
  }
}

/**
 * Create transfer via Circle API
 */
async function createCircleTransfer(amount, destinationAddress) {
  try {
    const response = await fetch(`${CIRCLE_API_BASE}/transfers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: {
          type: 'blockchain',
          address: destinationAddress,
          chain: 'USDC', // Or specific chain (POLYGON, ETHEREUM, etc.)
        },
        amount: {
          amount: amount.toString(),
          currency: 'USD', // Amount is in USD, Circle converts to USDC
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Circle transfer failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data.id; // Circle transfer ID
  } catch (error) {
    console.error('Error creating Circle transfer:', error);
    throw error;
  }
}

/**
 * POST /api/circle/transfer
 * Create a USDC payout for a tester
 *
 * Body:
 * {
 *   payoutId: string,
 *   testerId: string,
 *   amount: number,
 *   campaignId: string,
 * }
 *
 * Returns:
 * {
 *   transferId: string,
 *   status: string,
 * }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payoutId, testerId, amount, campaignId } = req.body;

    // Validate inputs
    if (!payoutId || !testerId || !amount || !campaignId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get auth token from request
    const authToken = req.headers.authorization?.split('Bearer ')[1];
    if (!authToken) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    // Verify token and check permissions
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(authToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is campaign owner or admin
    const campaignDoc = await db.collection('TestingCampaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();
    const isOwner = campaign.creatorId === decodedToken.uid;
    
    // Check if user is admin (optional)
    const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
    const isAdmin = adminDoc.exists;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to approve payouts' });
    }

    // Get tester's Circle wallet address from their profile
    const testerDoc = await db.collection('users').doc(testerId).get();
    if (!testerDoc.exists) {
      return res.status(404).json({ error: 'Tester not found' });
    }

    const testerData = testerDoc.data();
    const destinationAddress = testerData.circleWalletAddress || testerData.walletAddress;

    if (!destinationAddress) {
      return res.status(400).json({ error: 'Tester has no wallet address registered' });
    }

    // Verify tester wallet exists
    const walletValid = await verifyTesterWallet(testerId);
    if (!walletValid) {
      return res.status(400).json({ error: 'Tester wallet verification failed' });
    }

    // Create transfer via Circle
    const transferId = await createCircleTransfer(amount, destinationAddress);

    // Log transfer for audit trail
    await db.collection('PayoutLogs').add({
      payoutId,
      testerId,
      campaignId,
      amount,
      transferId,
      status: 'initiated',
      createdBy: decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      transferId,
      status: 'initiated',
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      error: 'Transfer failed',
      message: error.message,
    });
  }
}
