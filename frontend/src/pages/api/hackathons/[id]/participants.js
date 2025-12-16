import { db } from "../../../../lib/firebase/adminApp";

/**
 * Hackathon Participants API Endpoint
 * Handles participation tracking for specific hackathons
 * 
 * GET /api/hackathons/[id]/participants - List all participants
 * POST /api/hackathons/[id]/participants - Add participant
 * PUT /api/hackathons/[id]/participants/[userId] - Update participation
 * 
 * Follows ENHANCEMENT FIRST by extending existing user-project patterns
 * Maintains CLEAN separation with explicit validation
 */

export default async function handler(req, res) {
  const { id } = req.query;
  
  // PREVENT BLOAT: Validate hackathon ID early
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid hackathon ID' });
  }
  
  // CLEAN: Explicit method handling
  switch (req.method) {
    case 'GET':
      return handleGetParticipants(req, res, id);
    case 'POST':
      return handleAddParticipant(req, res, id);
    case 'PUT':
      return handleUpdateParticipant(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/hackathons/[id]/participants
 * List all participants for a hackathon
 * 
 * Query Parameters:
 * - status: Filter by participation status (participant, winner, etc.)
 */
async function handleGetParticipants(req, res, hackathonId) {
  try {
    const { status } = req.query;
    
    // AGGRESSIVE CONSOLIDATION: Reuse Firestore patterns
    const hackathonRef = db.collection('hackathons').doc(hackathonId);
    const participantsRef = hackathonRef.collection('participants');
    
    let query = participantsRef.orderBy('participationStatus', 'desc');
    
    // CLEAN: Explicit filtering
    if (status) {
      query = query.where('participationStatus', '==', status);
    }
    
    const snapshot = await query.get();
    
    // PERFORMANT: Batch fetch user data for participants
    const participants = await Promise.all(snapshot.docs.map(async doc => {
      const participantData = doc.data();
      
      // Get user details from users collection
      const userRef = db.collection('users').doc(participantData.userId);
      const userDoc = await userRef.get();
      
      return {
        id: doc.id,
        ...participantData,
        user: userDoc.exists ? userDoc.data() : null
      };
    }));
    
    // MODULAR: Consistent response format
    res.status(200).json({
      success: true,
      data: participants,
      count: participants.length
    });
    
  } catch (error) {
    console.error(`Error fetching participants for hackathon ${hackathonId}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * POST /api/hackathons/[id]/participants
 * Add a participant to a hackathon
 * 
 * Request Body:
 * {
 *   userId: string (required)
 *   projectId: string (required)
 *   participationStatus: 'participant' | 'winner' | 'finalist' (default: 'participant')
 *   prizeAmount: number (optional, for winners)
 *   prizeCategory: string (optional, for winners)
 *   verificationProof: string (optional, onchain proof)
 * }
 */
async function handleAddParticipant(req, res, hackathonId) {
  try {
    // CLEAN: Explicit validation
    const { userId, projectId } = req.body;
    
    if (!userId || !projectId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'projectId']
      });
    }
    
    // Verify hackathon exists
    const hackathonRef = db.collection('hackathons').doc(hackathonId);
    const hackathonDoc = await hackathonRef.get();
    
    if (!hackathonDoc.exists) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    
    // Verify user exists
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify project exists
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // CLEAN: Data validation and sanitization
    const participantData = {
      userId: String(userId).trim(),
      projectId: String(projectId).trim(),
      participationStatus: req.body.participationStatus || 'participant',
      prizeAmount: req.body.prizeAmount ? Number(req.body.prizeAmount) : 0,
      prizeCategory: req.body.prizeCategory ? String(req.body.prizeCategory).trim() : '',
      verificationProof: req.body.verificationProof ? String(req.body.verificationProof).trim() : '',
      verified: !!req.body.verificationProof, // Auto-verify if proof provided
      verifiedAt: req.body.verificationProof ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // AGGRESSIVE CONSOLIDATION: Reuse Firestore patterns
    const participantsRef = hackathonRef.collection('participants');
    const participantRef = await participantsRef.add(participantData);
    
    // MODULAR: Return consistent response
    res.status(201).json({
      success: true,
      data: {
        id: participantRef.id,
        ...participantData
      }
    });
    
  } catch (error) {
    console.error(`Error adding participant to hackathon ${hackathonId}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * PUT /api/hackathons/[id]/participants
 * Update participant status (e.g., from participant to winner)
 * 
 * Request Body:
 * {
 *   userId: string (required)
 *   participationStatus: string (required)
 *   prizeAmount: number (optional)
 *   prizeCategory: string (optional)
 *   verificationProof: string (optional)
 * }
 */
async function handleUpdateParticipant(req, res, hackathonId) {
  try {
    // CLEAN: Explicit validation
    const { userId, participationStatus } = req.body;
    
    if (!userId || !participationStatus) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'participationStatus']
      });
    }
    
    // Find the participant document
    const hackathonRef = db.collection('hackathons').doc(hackathonId);
    const participantsRef = hackathonRef.collection('participants');
    
    const querySnapshot = await participantsRef
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    const participantDoc = querySnapshot.docs[0];
    
    // CLEAN: Data validation and sanitization
    const updateData = {
      participationStatus: String(participationStatus).trim(),
      prizeAmount: req.body.prizeAmount ? Number(req.body.prizeAmount) : 0,
      prizeCategory: req.body.prizeCategory ? String(req.body.prizeCategory).trim() : '',
      updatedAt: new Date().toISOString()
    };
    
    // Handle verification proof update
    if (req.body.verificationProof) {
      updateData.verificationProof = String(req.body.verificationProof).trim();
      updateData.verified = true;
      updateData.verifiedAt = new Date().toISOString();
    }
    
    // AGGRESSIVE CONSOLIDATION: Reuse Firestore update pattern
    await participantDoc.ref.update(updateData);
    
    // MODULAR: Return updated data
    const updatedDoc = await participantDoc.ref.get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
    
  } catch (error) {
    console.error(`Error updating participant in hackathon ${hackathonId}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}