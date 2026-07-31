import { db } from '../../../lib/firebase/serverOnly';
import { logActivity } from '../../../utils/activityLogger';
import { authorizeProject, withDeveloperAuth } from '../../../lib/developerAuth/middleware';
import { completeReceipt, prepareIdempotency, readReceipt, recordMutationAudit } from '../../../lib/developerAuth/idempotency';

const ROUTE = '/api/projects/log';
const VALID_TYPES = new Set(['milestone', 'revenue', 'users', 'launch', 'partnership', 'funding', 'product', 'community', 'development', 'bugfix']);

function validMetrics(metrics) {
  if (metrics == null) return {};
  if (typeof metrics !== 'object' || Array.isArray(metrics) || Object.getPrototypeOf(metrics) !== Object.prototype) return null;
  const entries = Object.entries(metrics);
  if (entries.length > 20) return null;
  const output = {};
  for (const [key, value] of entries) {
    if (!key || key.length > 64 || !['string', 'number', 'boolean'].includes(typeof value) || !Number.isFinite(typeof value === 'number' ? value : 0)) return null;
    output[key] = value;
  }
  return output;
}

async function handler(req, res) {
  try {
    const { projectSlug, message, type = 'development', metrics } = req.body || {};
    if (typeof projectSlug !== 'string' || !projectSlug.trim()) return res.status(400).json({ error: 'projectSlug is required' });
    if (typeof message !== 'string' || message.trim().length < 1 || message.length > 2000) return res.status(400).json({ error: 'message must be 1 to 2000 characters' });
    const cleanMetrics = validMetrics(metrics);
    if (cleanMetrics === null) return res.status(400).json({ error: 'Invalid metrics' });
    const updateType = VALID_TYPES.has(type) ? type : 'development';
    const projectRef = db.collection('projects').doc(projectSlug);
    const userRef = db.collection('users').doc(req.developer.userId);
    const logRef = db.collection('ships_logs').doc();
    const prepared = prepareIdempotency(db, req.developer, 'POST', ROUTE, req.headers['idempotency-key'], req.body);
    const now = new Date();
    const result = await db.runTransaction(async (transaction) => {
      const receipt = await readReceipt(transaction, prepared);
      if (receipt) return { replay: true, ...receipt };
      const [projectSnap, userSnap] = await Promise.all([transaction.get(projectRef), transaction.get(userRef)]);
      if (!projectSnap.exists) { const error = new Error('Project not found'); error.statusCode = 404; throw error; }
      const project = projectSnap.data();
      if (!await authorizeProject(db, req.developer.userId, project, transaction)) { const error = new Error('Forbidden'); error.statusCode = 403; throw error; }
      const user = userSnap.exists ? userSnap.data() : {};
      const logEntry = {
        projectSlug, projectName: project.name, message: message.trim(), type: updateType,
        metrics: Object.keys(cleanMetrics).length ? cleanMetrics : null, timestamp: now,
        userId: req.developer.userId, userHandle: user.githubUsername || user.displayName || req.developer.userId,
      };
      const responseBody = { success: true, logEntry: { id: logRef.id, ...logEntry } };
      transaction.create(logRef, logEntry);
      completeReceipt(transaction, prepared, req.developer, 'POST', ROUTE, 201, responseBody, now);
      recordMutationAudit(transaction, db, req.developer, 'proof_created', `ships_logs/${logRef.id}`, now);
      return { statusCode: 201, responseBody, project };
    });
    if (result.replay) return res.status(result.statusCode).json({ ...result.responseBody, idempotentReplay: true });
    try {
      await logActivity({ type: 'ships_log_update', projectSlug, projectName: result.project.name, userHandle: result.responseBody.logEntry.userHandle, description: `🚢 Ship's Log: ${result.project.name} - ${message}`, ecosystem: result.project.ecosystem });
    } catch (error) { console.warn('Post-commit activity failed:', error.message); }
    return res.status(201).json(result.responseBody);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Internal server error' });
  }
}

export default withDeveloperAuth(handler, { requiredScopes: ['proofs:write'] });
