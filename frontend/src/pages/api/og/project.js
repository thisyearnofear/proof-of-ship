import { ImageResponse } from 'next/og';
import admin, { db } from '@/lib/firebase/adminApp';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }

    // We can't use firebase-admin in edge runtime easily
    // For this demonstration, we'll use mock data or a simplified fetch if possible
    // In a real app, you'd use the Firebase REST API or a standard API route (not edge)
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px', color: '#00ff00' }}>
            PROOF OF SHIP - PROJECT SCOUT
          </div>
          <div style={{ fontSize: '60px', fontWeight: 'bold', textAlign: 'center' }}>
            {slug.toUpperCase()}
          </div>
          <div style={{ display: 'flex', marginTop: '40px', gap: '20px' }}>
            <div style={{ padding: '10px 20px', backgroundColor: '#333', borderRadius: '10px' }}>1.5x ROI</div>
            <div style={{ padding: '10px 20px', backgroundColor: '#333', borderRadius: '10px' }}>2.0x ROI</div>
            <div style={{ padding: '10px 20px', backgroundColor: '#333', borderRadius: '10px' }}>3.0x ROI</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
