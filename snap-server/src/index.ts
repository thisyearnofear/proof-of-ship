import { Hono } from 'hono';
import * as admin from 'firebase-admin';
import { scoutSnap } from './snaps/scout';

const app = new Hono();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'proofofship',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'proofofship',
      });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.firestore();

// Manifest route for Farcaster Snap
app.get('/.well-known/farcaster.json', (c) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://proofofship.xyz';
  return c.json({
    accountAssociation: {
      header: "eyJmaWQiOiA4ODcyLCAidHlwZSI6ICJjdXN0b2RpYWwiLCAia2V5IjogIjB4N0U0M0Y0RDVFNjU0OEY0RTZFNDVFNjU0OEY0RTZFNDUifQ",
      payload: "eyJkb21haW4iOiAicHJvb2ZvZnNoaXaueHl6In0",
      signature: "MHg0ZTQzZjRkNTVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDVlNjU0OGY0ZTZlNDU"
    },
    frame: {
      version: "1",
      name: "Proof of Ship",
      iconUrl: `${baseUrl}/icon.png`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/og-image.png`,
      buttonTitle: "Open Proof of Ship",
      splashImageUrl: `${baseUrl}/splash.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${baseUrl}/api/webhook`
    }
  });
});

// Snap routes
app.route('/snaps/scout', scoutSnap);

// Hypersnap webhook handler
app.post('/api/webhook', async (c) => {
  const body = await c.req.json();
  console.log('Received Hypersnap webhook:', body);
  
  // Handle different event types from Hypersnap
  const { event, data } = body;
  
  if (event === 'notifications.enabled') {
    const { fid, token } = data;
    // Store token for user with this FID
    const userQuery = await db.collection('users').where('farcasterFid', '==', fid).get();
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        farcasterPushToken: token,
        notificationsEnabled: true
      });
    }
  }
  
  return c.json({ success: true });
});

// Helper route to send notifications via Hypersnap
app.post('/api/notify', async (c) => {
  const { fid, title, body } = await c.req.json();
  const apiKey = process.env.HYPERSNAP_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'HYPERSNAP_API_KEY not configured' }, 500);
  }

  try {
    const response = await fetch('https://api.hypersnap.xyz/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        fid,
        notification: {
          title,
          body
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hypersnap API error: ${response.status}`);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
