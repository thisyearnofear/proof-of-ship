import verificationService from '@/services/VerificationService';

/**
 * Hackathon Verification API Endpoint
 * Handles verification of hackathon participation
 * 
 * POST /api/verification/hackathon - Verify hackathon participation
 * GET /api/verification/hackathon/status - Get verification status
 * 
 * Follows ENHANCEMENT FIRST by using centralized verification service
 * Maintains CLEAN separation with dedicated verification logic
 */

export default async function handler(req, res) {
  // CLEAN: Explicit method handling
  switch (req.method) {
    case 'POST':
      return handleVerifyParticipation(req, res);
    case 'GET':
      return handleGetVerificationStatus(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * POST /api/verification/hackathon
 * Verify hackathon participation
 * 
 * Request Body:
 * {
 *   hackathonId: string (required)
 *   userId: string (required)
 *   verificationProof: string (optional, for onchain verification)
 *   verificationMethod: 'onchain' | 'offchain' (default: 'offchain')
 * }
 */
async function handleVerifyParticipation(req, res) {
  try {
    // CLEAN: Explicit validation
    const { hackathonId, userId, verificationProof, verificationMethod } = req.body;
    
    if (!hackathonId || !userId) {
      return res.status(400).json({ 
        error: 'hackathonId and userId are required'
      });
    }

    // MODULAR: Use verification service
    const result = await verificationService.verifyHackathonParticipation(
      hackathonId,
      userId,
      verificationProof,
      verificationMethod
    );

    // PERFORMANT: Return consistent response format
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

/**
 * GET /api/verification/hackathon/status
 * Get verification status for hackathon participation
 * 
 * Query Parameters:
 * - hackathonId: string (required)
 * - userId: string (required)
 */
async function handleGetVerificationStatus(req, res) {
  try {
    // CLEAN: Explicit validation
    const { hackathonId, userId } = req.query;
    
    if (!hackathonId || !userId) {
      return res.status(400).json({ 
        error: 'hackathonId and userId are required'
      });
    }

    // MODULAR: Use verification service
    const result = await verificationService.getVerificationStatus(
      hackathonId,
      userId
    );

    // PERFORMANT: Return consistent response format
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