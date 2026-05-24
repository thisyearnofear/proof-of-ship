/**
 * API Endpoint: Circle USDC Transfer
 * Handles payout transfers to testers using RealCircleService
 */

import { db, auth } from '@/lib/firebase/serverOnly';
import { realCircleService } from '../../../services/RealCircleService';

const SOURCE_WALLET_ID = process.env.CIRCLE_PAYOUT_WALLET_ID || process.env.CIRCLE_AGENT_WALLET_ID;

async function verifyTesterWalletAddress(destinationAddress) {
  return realCircleService.validateWalletAddress(destinationAddress);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payoutId, testerId, amount, campaignId, walletId } = req.body;

    if (!payoutId || !testerId || !amount || !campaignId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const authToken = req.headers.authorization?.split('Bearer ')[1];
    if (!authToken) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(authToken);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const campaignDoc = await db.collection('TestingCampaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();
    const isOwner = campaign.creatorId === decodedToken.uid;
    const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
    const isAdmin = adminDoc.exists;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to approve payouts' });
    }

    const testerDoc = await db.collection('users').doc(testerId).get();
    if (!testerDoc.exists) {
      return res.status(404).json({ error: 'Tester not found' });
    }

    const testerData = testerDoc.data();
    const destinationAddress = testerData.circleWalletAddress || testerData.walletAddress;

    if (!destinationAddress) {
      return res.status(400).json({ error: 'Tester has no wallet address registered' });
    }

    const walletValid = await verifyTesterWalletAddress(destinationAddress);
    if (!walletValid) {
      return res.status(400).json({ error: 'Tester wallet verification failed' });
    }

    const sourceWalletId = walletId || SOURCE_WALLET_ID;
    if (!sourceWalletId) {
      return res.status(500).json({ error: 'No Circle source wallet configured' });
    }

    const result = await realCircleService.createTransaction({
      walletId: sourceWalletId,
      amount: amount.toString(),
      destinationAddress,
      feeLevel: 'MEDIUM',
      metadata: { payoutId, testerId, campaignId, createdBy: decodedToken.uid }
    });

    const transferId = result.data?.id || result.data?.transaction?.id;

    await db.collection('PayoutLogs').add({
      payoutId,
      testerId,
      campaignId,
      amount,
      transferId,
      walletId: sourceWalletId,
      status: 'initiated',
      createdBy: decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      transferId,
      status: 'initiated',
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({
      error: 'Transfer failed',
      message: error.message,
    });
  }
}
