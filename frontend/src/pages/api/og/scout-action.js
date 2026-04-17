import { ImageResponse } from 'next/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

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
          READY TO BACK?
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center' }}>
          Scout potential found for {slug}
        </div>
        <div style={{ marginTop: '40px', fontSize: '24px', color: '#aaa' }}>
          Click below to open the Mini App and complete your back.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
