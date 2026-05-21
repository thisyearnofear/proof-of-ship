import { db } from '@/lib/firebase/serverOnly';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { milestone_id, project_data } = req.body || {};

  if (!milestone_id || !project_data) {
    return res.status(400).json({ error: 'Missing milestone_id or project_data' });
  }

  const verification = {
    milestoneId: String(milestone_id),
    projectData: project_data,
    verificationStatus: 'queued',
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    let weftResponse = null;

    if (process.env.WEFT_VERIFY_URL) {
      const response = await fetch(process.env.WEFT_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEFT_API_KEY ? { Authorization: `Bearer ${process.env.WEFT_API_KEY}` } : {})
        },
        body: JSON.stringify({
          milestone_id,
          project_data,
          callback_url: process.env.WEFT_CALLBACK_URL || `${getBaseUrl(req)}/api/verification/weft-callback`
        })
      });

      weftResponse = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      };

      if (!response.ok) {
        verification.verificationStatus = 'failed_to_submit';
      }
    }

    await db.collection('weftVerifications').doc(String(milestone_id)).set({
      ...verification,
      ...(weftResponse && { weftResponse })
    }, { merge: true });

    if (weftResponse && !weftResponse.ok) {
      return res.status(502).json({
        success: false,
        error: 'Failed to submit verification to Weft',
        weftResponse
      });
    }

    return res.status(202).json({
      success: true,
      status: verification.verificationStatus,
      milestone_id,
      mode: process.env.WEFT_VERIFY_URL ? 'submitted' : 'queued'
    });
  } catch (error) {
    console.error('[Weft Verify] Error submitting verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
