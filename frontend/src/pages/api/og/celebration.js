import { ImageResponse } from 'next/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type') || 'payout';

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
            backgroundColor: '#050a1f',
            backgroundImage: 'radial-gradient(circle at center, #1e3a8a 0%, #050a1f 100%)',
            color: '#fff',
            padding: '60px',
            fontFamily: 'sans-serif',
            border: '10px solid #1e40af',
          }}
        >
          <div style={{ 
            fontSize: '32px', 
            marginBottom: '20px', 
            color: '#3b82f6', 
            fontWeight: 'bold',
            letterSpacing: '2px'
          }}>
            PLEDGEBOND CELEBRATION
          </div>
          
          <div style={{ 
            fontSize: '80px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            textShadow: '0 4px 20px rgba(59, 130, 246, 0.5)'
          }}>
            {type === 'payout' ? '🚢 PAYOUT SECURED!' : '✅ MILESTONE HIT!'}
          </div>
          
          <div style={{ 
            fontSize: '48px', 
            marginTop: '30px', 
            color: '#94a3b8',
            textAlign: 'center'
          }}>
            Project: <span style={{ color: '#fff' }}>{slug?.toUpperCase() || 'UNKNOWN'}</span>
          </div>

          <div style={{ 
            display: 'flex', 
            marginTop: '60px', 
            gap: '30px',
            fontSize: '24px'
          }}>
            <div style={{ 
              padding: '15px 30px', 
              backgroundColor: '#10b981', 
              borderRadius: '50px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              BUILDERS SHIPPING
            </div>
            <div style={{ 
              padding: '15px 30px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '50px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              TRUST MINED
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            fontSize: '20px',
            color: '#475569'
          }}>
            pledgebond.vercel.app/fleet
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
