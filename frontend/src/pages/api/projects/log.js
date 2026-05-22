/**
 * POST /api/projects/log
 *
 * Posts a structured update to a project's ShipsLog.
 *
 * Auth options:
 *   1. Firebase Auth token (via Authorization: Bearer header) — browser users
 *   2. User API key (via x-api-key header) — agents/programmatic access
 *
 * Body: {
 *   projectSlug: string (required),
 *   message: string (required),
 *   type: 'milestone' | 'revenue' | 'users' | ... (default: 'development'),
 *   metrics: { key: value } (optional),
 * }
 */

import { db, auth } from '../../../lib/firebase/serverOnly';
import { logActivity } from '../../../utils/activityLogger';

const VALID_UPDATE_TYPES = new Set([
  'milestone', 'revenue', 'users', 'launch', 'partnership',
  'funding', 'product', 'community', 'development', 'bugfix',
]);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId;
  let userData;

  try {
    // Try Firebase Auth first (Authorization: Bearer)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    }

    // Fall back to API key auth (x-api-key) for agents
    if (!userId) {
      const apiKey = req.headers['x-api-key'];
      if (!apiKey) {
        return res.status(401).json({ error: 'Authorization required. Use Bearer token or x-api-key.' });
      }

      // Find user by API key
      const userSnap = await db
        .collection('users')
        .where('apiKey', '==', apiKey)
        .limit(1)
        .get();

      if (userSnap.empty) {
        return res.status(403).json({ error: 'Invalid API key' });
      }

      userId = userSnap.docs[0].id;
    }

    // Load user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'User not found' });
    }
    userData = userDoc.data();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const { projectSlug, message, type = 'development', metrics } = req.body;

  if (!projectSlug || !message) {
    return res.status(400).json({ error: 'Missing projectSlug or message' });
  }

  // Validate update type
  const updateType = VALID_UPDATE_TYPES.has(type) ? type : 'development';

  // Verify permission
  const hasPermission = (userData.permissions || []).some(
    (p) => p.projectSlug === projectSlug && p.role === 'editor'
  );

  if (!hasPermission) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // Get project name
  const projectSnap = await db.collection('projects').doc(projectSlug).get();
  if (!projectSnap.exists) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const projectData = projectSnap.data();

  // Clean metrics — only store truthy values
  const cleanMetrics = {};
  if (metrics && typeof metrics === 'object') {
    for (const [key, val] of Object.entries(metrics)) {
      if (val !== undefined && val !== null && val !== '') {
        cleanMetrics[key] = typeof val === 'string' ? val : val;
      }
    }
  }

  const logEntry = {
    projectSlug,
    projectName: projectData.name,
    message,
    type: updateType,
    metrics: Object.keys(cleanMetrics).length > 0 ? cleanMetrics : null,
    timestamp: new Date().toISOString(),
    userId,
    userHandle: userData.githubUsername || userData.displayName || userId,
  };

  // Save log entry
  await db.collection('ships_logs').add(logEntry);

  // Log to engagement feed (only for non-low-signal updates)
  const HIGH_SIGNAL_TYPES = new Set(['milestone', 'revenue', 'users', 'launch', 'partnership', 'funding']);
  const isHighSignal = HIGH_SIGNAL_TYPES.has(updateType);

  await logActivity({
    type: 'ships_log_update',
    projectSlug,
    projectName: projectData.name,
    userHandle: logEntry.userHandle,
    description: isHighSignal
      ? `🚢 ${updateType}: ${projectData.name} - ${message}`
      : `🚢 Ship's Log: ${projectData.name} - ${message}`,
    ecosystem: projectData.ecosystem,
    metadata: {
      message,
      type: updateType,
      metrics: cleanMetrics,
      isHighSignal,
    },
  });

  res.status(201).json({ success: true, logEntry });
}

export default handler;
