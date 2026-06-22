import verificationService from '@/lib/verification/VerificationService';

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === "funding") {
    return handleFundingEligibility(req, res);
  }

  if (action === "hackathon" || !action) {
    return handleHackathon(req, res);
  }

  return res.status(404).json({ error: `Unknown action: ${action}` });
}

async function handleFundingEligibility(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const result = await verificationService.verifyFundingEligibility(userId);

    res.status(200).json({
      success: true,
      eligible: result.eligible,
      eligibilityScore: result.score,
      eligibilityFactors: result.factors,
      estimatedFundingAmount: result.eligible ? calculateEstimatedFunding(result.score) : 0
    });

  } catch (error) {
    console.error('Error checking funding eligibility:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

function calculateEstimatedFunding(score) {
  const baseAmount = 500;
  const additionalAmount = Math.floor((score - 50) * 50);
  return Math.min(Math.max(baseAmount + additionalAmount, 500), 5000);
}

async function handleHackathon(req, res) {
  switch (req.method) {
    case 'POST':
      return handleVerifyParticipation(req, res);
    case 'GET':
      return handleGetVerificationStatus(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleVerifyParticipation(req, res) {
  try {
    const { hackathonId, userId, verificationProof, verificationMethod } = req.body;

    if (!hackathonId || !userId) {
      return res.status(400).json({
        error: 'hackathonId and userId are required'
      });
    }

    const result = await verificationService.verifyHackathonParticipation(
      hackathonId,
      userId,
      verificationProof,
      verificationMethod
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        verified: result.verified,
        method: result.method,
        details: result.details
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleGetVerificationStatus(req, res) {
  try {
    const { hackathonId, userId } = req.query;

    if (!hackathonId || !userId) {
      return res.status(400).json({
        error: 'hackathonId and userId are required'
      });
    }

    const result = await verificationService.getVerificationStatus(
      hackathonId,
      userId
    );

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
