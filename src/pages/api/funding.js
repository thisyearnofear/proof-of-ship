import { usdcPaymentService } from '../../lib/usdcPayments';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
