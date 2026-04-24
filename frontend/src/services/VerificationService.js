/**
 * Verification Service
 * Handles onchain and offchain verification for hackathon participation, funding eligibility, etc.
 * 
 * Follows ENHANCEMENT FIRST by providing reusable verification across systems
 * Maintains CLEAN separation with dedicated verification logic
 * Implements MODULAR design for different verification types
 */

import { db } from '@/lib/firebase/serverOnly';

class VerificationService {
  /**
   * Verify hackathon participation
   * Supports both onchain (contract-based) and offchain (manual) verification
   * 
   * @param {string} hackathonId - Hackathon ID
   * @param {string} userId - User ID
   * @param {string} verificationProof - Onchain proof (tx hash, attestation, etc.)
   * @param {string} verificationMethod - 'onchain' or 'offchain'
   * @returns {Promise<Object>} Verification result
   */
  async verifyHackathonParticipation(hackathonId, userId, verificationProof, verificationMethod = 'offchain') {
    try {
      // PREVENT BLOAT: Validate required parameters
      if (!hackathonId || !userId) {
        throw new Error('hackathonId and userId are required');
      }

      // CLEAN: Validate hackathon exists
      const hackathonRef = db.collection('hackathons').doc(hackathonId);
      const hackathonDoc = await hackathonRef.get();
      
      if (!hackathonDoc.exists) {
        throw new Error('Hackathon not found');
      }

      const hackathonData = hackathonDoc.data();

      // CLEAN: Validate user exists
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      // MODULAR: Different verification methods
      let verificationResult;
      
      if (verificationMethod === 'onchain') {
        verificationResult = await this._verifyOnchain(hackathonData, userId, verificationProof);
      } else {
        verificationResult = await this._verifyOffchain(hackathonData, userId);
      }

      // PERFORMANT: Update participant record with verification
      const participantsRef = hackathonRef.collection('participants');
      const participantQuery = await participantsRef
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (participantQuery.empty) {
        throw new Error('Participant not found in this hackathon');
      }

      const participantDoc = participantQuery.docs[0];
      
      await participantDoc.ref.update({
        verified: verificationResult.verified,
        verificationProof: verificationProof || null,
        verificationMethod,
        verifiedAt: new Date().toISOString(),
        verificationDetails: verificationResult.details || null
      });

      return {
        success: true,
        verified: verificationResult.verified,
        method: verificationMethod,
        details: verificationResult.details
      };
      
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: error.message,
        verified: false
      };
    }
  }

  /**
   * Onchain verification using smart contract
   * 
   * @private
   * @param {Object} hackathonData - Hackathon data
   * @param {string} userId - User ID
   * @param {string} verificationProof - Onchain proof
   * @returns {Promise<Object>} Verification result
   */
  async _verifyOnchain(hackathonData, userId, verificationProof) {
    // In a real implementation, this would:
    // 1. Connect to blockchain (Ethers.js, Web3.js)
    // 2. Call verification contract
    // 3. Validate proof onchain
    // 4. Return verification result
    
    // For now, we'll simulate onchain verification
    console.log(`Simulating onchain verification for user ${userId}`);
    console.log(`Contract: ${hackathonData.verificationContract}`);
    console.log(`Proof: ${verificationProof}`);

    // MODULAR: Simulated verification logic
    // In production, replace with actual contract call
    const isValidProof = verificationProof && verificationProof.startsWith('0x');

    return {
      verified: isValidProof,
      details: {
        method: 'onchain',
        contract: hackathonData.verificationContract,
        proof: verificationProof,
        validated: isValidProof
      }
    };
  }

  /**
   * Offchain verification (manual/admin)
   * 
   * @private
   * @param {Object} hackathonData - Hackathon data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Verification result
   */
  async _verifyOffchain(hackathonData, userId) {
    // Offchain verification typically involves:
    // 1. Admin review
    // 2. Manual validation
    // 3. Documentation check
    
    console.log(`Performing offchain verification for user ${userId}`);

    // MODULAR: Simulated admin verification
    // In production, this would involve admin interface
    return {
      verified: true, // Admin has approved
      details: {
        method: 'offchain',
        verifiedBy: 'admin',
        verifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get verification status for a participant
   * 
   * @param {string} hackathonId - Hackathon ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Verification status
   */
  async getVerificationStatus(hackathonId, userId) {
    try {
      // PREVENT BLOAT: Validate parameters
      if (!hackathonId || !userId) {
        throw new Error('hackathonId and userId are required');
      }

      // CLEAN: Check hackathon and participant existence
      const hackathonRef = db.collection('hackathons').doc(hackathonId);
      const participantsRef = hackathonRef.collection('participants');
      
      const participantQuery = await participantsRef
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (participantQuery.empty) {
        return {
          verified: false,
          status: 'not_participating'
        };
      }

      const participantData = participantQuery.docs[0].data();

      return {
        verified: participantData.verified || false,
        status: participantData.verified ? 'verified' : 'pending',
        method: participantData.verificationMethod || null,
        proof: participantData.verificationProof || null,
        verifiedAt: participantData.verifiedAt || null,
        participationStatus: participantData.participationStatus || null
      };
      
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        verified: false,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Verify funding eligibility based on hackathon participation
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Eligibility result
   */
  async verifyFundingEligibility(userId) {
    try {
      // PREVENT BLOAT: Validate user
      if (!userId) {
        throw new Error('userId is required');
      }

      // CLEAN: Get user's hackathon participation
      const hackathonsRef = db.collection('hackathons');
      const hackathonsSnapshot = await hackathonsRef.get();

      let totalWins = 0;
      let totalParticipations = 0;
      let recentWin = null;

      // PERFORMANT: Process hackathons in parallel would be better
      // but for simplicity, we'll do sequential
      for (const hackathonDoc of hackathonsSnapshot.docs) {
        const participantsRef = hackathonDoc.ref.collection('participants');
        const participantQuery = await participantsRef
          .where('userId', '==', userId)
          .limit(1)
          .get();

        if (!participantQuery.empty) {
          totalParticipations++;
          const participantData = participantQuery.docs[0].data();
          
          if (participantData.participationStatus === 'winner') {
            totalWins++;
            
            // Track most recent win
            if (!recentWin || new Date(participantData.verifiedAt) > new Date(recentWin.verifiedAt)) {
              recentWin = {
                hackathonId: hackathonDoc.id,
                ...participantData
              };
            }
          }
        }
      }

      // MODULAR: Calculate eligibility score
      const eligibilityScore = this._calculateEligibilityScore(
        totalParticipations,
        totalWins,
        recentWin
      );

      return {
        eligible: eligibilityScore > 0,
        score: eligibilityScore,
        factors: {
          totalParticipations,
          totalWins,
          hasRecentWin: !!recentWin,
          recentWin
        }
      };
      
    } catch (error) {
      console.error('Error verifying funding eligibility:', error);
      return {
        eligible: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Calculate eligibility score based on participation history
   * 
   * @private
   * @param {number} totalParticipations - Total hackathon participations
   * @param {number} totalWins - Total hackathon wins
   * @param {Object|null} recentWin - Most recent win data
   * @returns {number} Eligibility score (0-100)
   */
  _calculateEligibilityScore(totalParticipations, totalWins, recentWin) {
    // DRY: Base score calculation
    let score = 0;

    // Participation score (max 40 points)
    score += Math.min(totalParticipations * 10, 40);

    // Win score (max 50 points)
    score += Math.min(totalWins * 25, 50);

    // Recent win bonus (10 points)
    if (recentWin) {
      score += 10;
    }

    // CLEAN: Cap at 100
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Verify project deployment for funding eligibility
   * 
   * @param {string} projectId - Project ID
   * @param {string} deploymentProof - Deployment transaction hash or proof
   * @returns {Promise<Object>} Verification result
   */
  async verifyProjectDeployment(projectId, deploymentProof) {
    try {
      // PREVENT BLOAT: Validate parameters
      if (!projectId || !deploymentProof) {
        throw new Error('projectId and deploymentProof are required');
      }

      // CLEAN: Check project exists
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();
      
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      // MODULAR: Simulated deployment verification
      // In production, this would verify onchain deployment
      const isValidDeployment = deploymentProof && deploymentProof.startsWith('0x');

      if (isValidDeployment) {
        // Update project with deployment info
        await projectRef.update({
          deploymentVerified: true,
          deploymentProof,
          deploymentVerifiedAt: new Date().toISOString()
        });
      }

      return {
        verified: isValidDeployment,
        projectId,
        deploymentProof
      };
      
    } catch (error) {
      console.error('Error verifying project deployment:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }
}

// MODULAR: Export singleton instance
const verificationService = new VerificationService();
export default verificationService;