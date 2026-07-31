import { db } from "../../../lib/firebase/serverOnly";

/**
 * Hackathon API Endpoint
 * Handles CRUD operations for hackathons
 * 
 * GET /api/hackathons - List all hackathons
 * POST /api/hackathons - Create new hackathon
 * 
 * Follows ENHANCEMENT FIRST principle by extending existing Firestore patterns
 * Maintains CLEAN separation of concerns with explicit data validation
 */

export default async function handler(req, res) {
  // AGGRESSIVE CONSOLIDATION: Reuse existing Firestore client
  // CLEAN: Explicit method handling with clear separation
  
  switch (req.method) {
    case 'GET':
      return handleGetHackathons(req, res);
    case 'POST':
      return handleCreateHackathon(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/hackathons
 * List all hackathons with optional filtering
 * 
 * Query Parameters:
 * - ecosystem: Filter by ecosystem (ethereum, polygon, etc.)
 * - status: Filter by status (upcoming, active, completed)
 * - limit: Limit number of results
 */
async function handleGetHackathons(req, res) {
  try {
    const { ecosystem, status, limit = 50 } = req.query;
    
    // DRY: Reuse Firestore query patterns from existing code
    let query = db.collection('hackathons').orderBy('startDate', 'desc');
    
    // CLEAN: Explicit query building with clear conditions
    if (ecosystem) {
      const ecosystems = String(ecosystem).split(',').map(id => id.trim()).filter(Boolean);
      query = ecosystems.length === 1
        ? query.where('ecosystem', '==', ecosystems[0])
        : query.where('ecosystem', 'in', ecosystems.slice(0, 10));
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    query = query.limit(Number(limit));
    
    const snapshot = await query.get();
    
    const hackathons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // PERFORMANT: Return paginated results
    res.status(200).json({
      success: true,
      data: hackathons,
      count: hackathons.length
    });
    
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * POST /api/hackathons
 * Create a new hackathon
 * 
 * Request Body:
 * {
 *   name: string (required)
 *   ecosystem: string (required)
 *   startDate: string (ISO date, required)
 *   endDate: string (ISO date, required)
 *   prizePool: number (optional)
 *   sponsors: string[] (optional)
 *   tracks: string[] (optional)
 *   verificationContract: string (optional)
 *   status: 'upcoming' | 'active' | 'completed' (default: 'upcoming')
 * }
 */
async function handleCreateHackathon(req, res) {
  try {
    // CLEAN: Explicit validation with clear error messages
    const { 
      name, 
      ecosystem, 
      startDate, 
      endDate, 
      prizePool = 0, 
      sponsors = [],
      tracks = [],
      verificationContract = '',
      status = 'upcoming'
    } = req.body;
    
    // PREVENT BLOAT: Validate required fields only
    if (!name || !ecosystem || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'ecosystem', 'startDate', 'endDate']
      });
    }
    
    // CLEAN: Data validation and sanitization
    const hackathonData = {
      name: String(name).trim(),
      ecosystem: String(ecosystem).trim().toLowerCase(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      prizePool: Number(prizePool),
      sponsors: Array.isArray(sponsors) ? sponsors.map(s => String(s).trim()) : [],
      tracks: Array.isArray(tracks) ? tracks.map(t => String(t).trim().toLowerCase()) : [],
      verificationContract: String(verificationContract).trim(),
      status: ['upcoming', 'active', 'completed'].includes(status) ? status : 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // AGGRESSIVE CONSOLIDATION: Reuse existing Firestore patterns
    const ref = await db.collection('hackathons').add(hackathonData);
    
    // MODULAR: Return consistent response format
    res.status(201).json({
      success: true,
      data: {
        id: ref.id,
        ...hackathonData
      }
    });
    
  } catch (error) {
    console.error('Error creating hackathon:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
