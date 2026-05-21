/**
 * Winding Down Projects Handler
 *
 * GET  /api/projects/winding-down — list projects in winding_down state
 * POST /api/projects/winding-down — process expired winding_down projects
 *
 * Projects enter winding_down when a builder requests deletion but active
 * backings exist. After 30 days, if no active backings remain, the project
 * is fully deleted. If backings remain, the expiry is extended.
 */

import { db } from '../../../lib/firebase/serverOnly';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const snap = await db.collection('projects')
        .where('status', '==', 'winding_down')
        .get();

      const projects = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        projects.push({
          slug: doc.id,
          name: data.name,
          ecosystem: data.ecosystem,
          windingDownAt: data.windingDownAt,
          windingDownExpiry: data.windingDownExpiry,
          windingDownReason: data.windingDownReason,
        });
      }

      return res.status(200).json({ projects, count: projects.length });
    }

    if (method === 'POST') {
      const now = new Date();
      const snap = await db.collection('projects')
        .where('status', '==', 'winding_down')
        .get();

      let processed = 0;
      let deleted = 0;
      let extended = 0;
      const results = [];

      for (const doc of snap.docs) {
        const data = doc.data();
        const slug = doc.id;
        const expiry = new Date(data.windingDownExpiry);

        if (now < expiry) {
          results.push({ slug, status: 'still_winding', expiresAt: data.windingDownExpiry });
          continue;
        }

        processed++;

        const backingsSnap = await db.collection('backings')
          .where('projectSlug', '==', slug)
          .where('status', '==', 'active')
          .get();

        if (backingsSnap.size === 0) {
          await doc.ref.delete();
          deleted++;
          results.push({ slug, status: 'deleted' });
        } else {
          const newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await doc.ref.update({
            windingDownExpiry: newExpiry.toISOString(),
            updatedAt: now.toISOString(),
          });
          extended++;
          results.push({
            slug,
            status: 'extended',
            activeBackings: backingsSnap.size,
            newExpiry: newExpiry.toISOString(),
          });
        }
      }

      return res.status(200).json({ processed, deleted, extended, results });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[WindingDown] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ['GET', 'POST'],
  rateLimit: 10,
  rateLimitKey: 'WINDING_DOWN',
});
