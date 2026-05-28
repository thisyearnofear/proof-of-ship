import { Hono } from 'hono';
import { db } from '../index';

export const scoutSnap = new Hono();

scoutSnap.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const projectDoc = await db.collection('projects').doc(slug).get();

  if (!projectDoc.exists) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const project = projectDoc.data();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://proof-of-ship.vercel.app';

  // For Project Scout Snap, we show the project and multiplier options
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og/project?slug=${slug}" />
        <meta property="fc:frame:button:1" content="1.5x ROI" />
        <meta property="fc:frame:button:2" content="2.0x ROI" />
        <meta property="fc:frame:button:3" content="3.0x ROI" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/snaps/scout/${slug}/select" />
      </head>
      <body>
        <h1>Scout Project: ${project?.name}</h1>
        <p>${project?.description}</p>
      </body>
    </html>
  `);
});

scoutSnap.post('/:slug/select', async (c) => {
  const slug = c.req.param('slug');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://proof-of-ship.vercel.app';
  
  // In a real implementation, we'd parse the frame message
  // For now we'll assume the button index corresponds to the multiplier
  
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og/scout-action?slug=${slug}" />
        <meta property="fc:frame:button:1" content="Back this Project" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}/projects/${slug}" />
      </head>
    </html>
  `);
});
