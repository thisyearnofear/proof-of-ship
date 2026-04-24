import { db } from "../../../lib/firebase/serverOnly";

/**
 * Individual Hackathon API Endpoint
 * Handles operations for specific hackathons
 * 
 * GET /api/hackathons/[id] - Get hackathon details
 * PUT /api/hackathons/[id] - Update hackathon
 * DELETE /api/hackathons/[id] - Delete hackathon
 * 
 * Follows ENHANCEMENT FIRST principle by extending existing patterns
 * Maintains CLEAN separation with explicit error handling
 */

export default async function handler(req, res) {
  const { id } = req.query;
  
  // PREVENT BLOAT: Validate ID format early
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid hackathon ID' });
  }
  
  // CLEAN: Explicit method handling
  switch (req.method) {
    case 'GET':
      return handleGetHackathon(req, res, id);
    case 'PUT':
      return handleUpdateHackathon(req, res, id);
    case 'DELETE':
      return handleDeleteHackathon(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/hackathons/[id]
 * Get details for a specific hackathon including participation data
 */
async function handleGetHackathon(req, res, id) {
  try {
    // AGGRESSIVE CONSOLIDATION: Reuse Firestore patterns
    const hackathonRef = db.collection('hackathons').doc(id);
    const hackathonDoc = await hackathonRef.get();
    
    if (!hackathonDoc.exists) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    
    const hackathonData = hackathonDoc.data();
    
    // Get participation data (MODULAR: separate subcollection)
    const participantsSnapshot = await hackathonRef
      .collection('participants')
      .get();
    
    const participants = participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // PERFORMANT: Return comprehensive data in single request
    res.status(200).json({
      success: true,
      data: {
        id: hackathonDoc.id,
        ...hackathonData,
        participants: participants
      }
    });
    
  } catch (error) {
    console.error(`Error fetching hackathon ${id}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * PUT /api/hackathons/[id]
 * Update a hackathon
 * 
 * Request Body: Partial hackathon data to update
 */
async function handleUpdateHackathon(req, res, id) {
  try {
    // CLEAN: Explicit validation
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    
    const hackathonRef = db.collection('hackathons').doc(id);
    const hackathonDoc = await hackathonRef.get();
    
    if (!hackathonDoc.exists) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    
    // CLEAN: Data sanitization and validation
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // PREVENT BLOAT: Only update allowed fields
    const allowedFields = [
      'name', 'ecosystem', 'startDate', 'endDate', 'prizePool',
      'sponsors', 'tracks', 'verificationContract', 'status'
    ];
    
    const sanitizedData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => 
        allowedFields.includes(key)
      )
    );
    
    // AGGRESSIVE CONSOLIDATION: Reuse Firestore update pattern
    await hackathonRef.update(sanitizedData);
    
    // MODULAR: Return updated data
    const updatedDoc = await hackathonRef.get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
    
  } catch (error) {
    console.error(`Error updating hackathon ${id}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * DELETE /api/hackathons/[id]
 * Delete a hackathon
 */
async function handleDeleteHackathon(req, res, id) {
  try {
    const hackathonRef = db.collection('hackathons').doc(id);
    const hackathonDoc = await hackathonRef.get();
    
    if (!hackathonDoc.exists) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    
    // CLEAN: Explicit deletion with safety check
    // Note: In production, add additional safety checks
    // (e.g., only allow deletion of past hackathons)
    
    await hackathonRef.delete();
    
    // MODULAR: Consistent response format
    res.status(200).json({
      success: true,
      message: 'Hackathon deleted successfully'
    });
    
  } catch (error) {
    console.error(`Error deleting hackathon ${id}:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}