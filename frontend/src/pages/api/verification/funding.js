import verificationService from '@/services/VerificationService';

/**
 * Funding Eligibility Verification API Endpoint
 * Handles verification of funding eligibility based on hackathon participation
 * 
 * GET /api/verification/funding - Check funding eligibility
 * 
 * Follows ENHANCEMENT FIRST by using centralized verification service
 * Maintains CLEAN separation with dedicated eligibility logic
 */

export default async function handler(req, res) {
  // CLEAN: Explicit method handling
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return handleCheckFundingEligibility(req, res);
}

/**
 * GET /api/verification/funding
 * Check funding eligibility based on hackathon participation
 * 
 * Query Parameters:
 * - userId: string (required)
 */
async function handleCheckFundingEligibility(req, res) {
  try {
    // CLEAN: Explicit validation
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required'
      });
    }

    // MODULAR: Use verification service
    const result = await verificationService.verifyFundingEligibility(userId);

    // PERFORMANT: Return comprehensive eligibility data
    res.status(200).json({
      success: true,
      eligible: result.eligible,
      eligibilityScore: result.score,
      eligibilityFactors: result.factors,
      // Additional funding-related calculations could go here
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

/**
 * Calculate estimated funding amount based on eligibility score
 * 
 * @param {number} score - Eligibility score (0-100)
 * @returns {number} Estimated funding amount in USD
 */
function calculateEstimatedFunding(score) {
  // DRY: Base calculation from eligibility score
  // This is a simplified calculation - in production, this would be more complex
  
  // Base amount for minimum eligibility
  const baseAmount = 500;
  
  // Additional amount based on score
  // Score 50 = $500, Score 100 = $5000
  const additionalAmount = Math.floor((score - 50) * 50);
  
  // CLEAN: Ensure minimum and maximum amounts
  return Math.min(Math.max(baseAmount + additionalAmount, 500), 5000);
}