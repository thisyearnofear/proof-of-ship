import { usdcPaymentService, getFundingTier } from '../../lib/usdcPayments';

import { withApiMiddleware, isAdmin } from '../../utils/apiMiddleware';
import { db } from '../../lib/firebase/adminApp';

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...data } = req.body;

    // For admin actions, authenticate and check admin status
    const adminActions = new Set(['approveTesterReward']);
    let userId = null;
    if (adminActions.has(action)) {
      const { uid, isAdmin: admin } = await isAdmin(req, (await import('../../lib/firebase/adminApp')).auth, db);
      if (!admin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      userId = uid;
    }
    const { action, ...data } = req.body;

    switch (action) {
      case 'createWallet':
        const wallet = await usdcPaymentService.createWallet(data.userId);
        return res.status(200).json({ success: true, wallet });

      case 'getBalance':
        const balance = await usdcPaymentService.getWalletBalance(data.walletId);
        return res.status(200).json({ success: true, balance });

      case 'processFunding':
        const { developerAddress, creditScore, creditData } = data;
        
        // Validate input
        if (!developerAddress || !creditScore) {
          return res.status(400).json({ 
            error: 'Missing required fields: developerAddress, creditScore' 
          });
        }

        // Check minimum credit score
        if (creditScore < 400) {
          return res.status(400).json({ 
            error: 'Credit score too low for funding eligibility' 
          });
        }

        const result = await usdcPaymentService.processDeveloperFunding(
          developerAddress,
          creditScore,
          creditData
        );

        return res.status(200).json(result);

      case 'getTransferStatus':
        const status = await usdcPaymentService.getTransferStatus(data.transferId);
        return res.status(200).json({ success: true, status });

      case 'getFundingHistory':
        const history = await usdcPaymentService.getFundingHistory(data.developerAddress);
        return res.status(200).json({ success: true, history });

      case 'calculateFunding':
        const { creditScore: score } = data;
        if (!score || score < 0 || score > 850) {
          return res.status(400).json({ 
            error: 'Invalid credit score. Must be between 0 and 850.' 
          });
        }
        
        const calculatedAmount = usdcPaymentService.calculateFundingAmount(score);
        const tier = getFundingTier(score);
        
        return res.status(200).json({ 
          success: true, 
          amount: calculatedAmount,
          creditScore: score,
          tier,
          eligible: score >= 400
        });

      case 'checkConfiguration':
        const isConfigured = usdcPaymentService.isConfigured();
        const environment = usdcPaymentService.getEnvironment();
        
        return res.status(200).json({ 
          success: true, 
          configured: isConfigured,
          environment,
          message: isConfigured 
            ? `Circle API configured for ${environment} environment`
            : 'Circle API not configured - using mock mode'
        });

      case 'transferUSDC':
        const { sourceWalletId, destinationAddress, amount, reason } = data;
        
        if (!sourceWalletId || !destinationAddress || !amount) {
          return res.status(400).json({ 
            error: 'Missing required fields: sourceWalletId, destinationAddress, amount' 
          });
        }

        const transferResult = await usdcPaymentService.transferUSDCWithReason(
          sourceWalletId,
          destinationAddress,
          amount,
          reason
        );
        
        return res.status(200).json({ success: true, transfer: transferResult });

      case 'approveTesterReward': {
        const { feedbackId, projectSlug, taskId, sourceWalletId, destinationAddress, amount } = data;
        if (!feedbackId || !projectSlug || !taskId || !sourceWalletId || !destinationAddress) {
          return res.status(400).json({ error: 'Missing required fields for approveTesterReward' });
        }
        // Validate feedback exists and matches project/task
        const fbSnap = await db.collection('feedback').doc(feedbackId).get();
        if (!fbSnap.exists) {
          return res.status(404).json({ error: 'Feedback not found' });
        }
        const fb = fbSnap.data();
        if (fb.projectSlug !== projectSlug || fb.taskId !== taskId) {
          return res.status(400).json({ error: 'Feedback does not match project/task' });
        }
        // Validate task exists and get reward default
        const projSnap = await db.collection('projects').doc(projectSlug).get();
        if (!projSnap.exists) {
          return res.status(404).json({ error: 'Project not found' });
        }
        const proj = projSnap.data();
        const task = (proj.testerTasks || []).find(t => t.id === taskId);
        if (!task) {
          return res.status(400).json({ error: 'Invalid task for project' });
        }
        const payoutAmount = typeof amount === 'number' && amount > 0 ? amount : Number(task.rewardUSDC || 0);
        if (!payoutAmount || payoutAmount <= 0) {
          return res.status(400).json({ error: 'Invalid payout amount' });
        }
        // Transfer
        const transfer = await usdcPaymentService.transferUSDCWithReason(sourceWalletId, destinationAddress, payoutAmount, `tester_reward:${projectSlug}:${taskId}:${feedbackId}`);
        // Mark feedback as accepted
        await db.collection('feedback').doc(feedbackId).set({ status: 'accepted', acceptedAt: new Date().toISOString(), approvedBy: userId }, { merge: true });
        return res.status(200).json({ success: true, transfer });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Funding API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
