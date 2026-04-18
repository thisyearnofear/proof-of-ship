import { Hono } from 'hono';
import { db } from '../index';

export const celebrationSnap = new Hono();

celebrationSnap.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const type = c.req.query('type') || 'payout'; // payout, milestone
  const projectDoc = await db.collection('projects').doc(slug).get();

  if (!projectDoc.exists) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const project = projectDoc.data();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://proofofship.xyz';

  // Social celebration frame
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og/celebration?slug=${slug}&type=${type}" />
        <meta property="fc:frame:button:1" content="🤝 Back ${project?.name}" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}/projects/${slug}" />
        <meta property="fc:frame:button:2" content="🚢 View Fleet Map" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${baseUrl}/fleet" />
      </head>
      <body>
        <h1>Celebrate ${project?.name}!</h1>
        <p>${type === 'payout' ? 'A builder just got paid!' : 'A milestone was hit!'}</p>
      </body>
    </html>
  `);
});
