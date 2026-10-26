import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

/**
 * OG Image Generation using Vercel OG
 * Requirements: 20.9, 28.4
 * 
 * Generates dynamic Open Graph images for listings and pages
 */

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters from query string
    const title = searchParams.get('title') || "FindAm - Nigeria's #1 Youth Marketplace";
    const description = searchParams.get('description') || 'Buy, sell, and discover amazing deals';
    const price = searchParams.get('price');
    const location = searchParams.get('location');
    const type = searchParams.get('type') || 'default'; // default, listing, vendor

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
            backgroundColor: '#1a1a2e',
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              maxWidth: '1000px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo/Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #00C853 0%, #00E5FF 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  display: 'flex',
                }}
              >
                ✨ FindAm
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: type === 'listing' ? '56px' : '64px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '28px',
                color: '#B0B0B0',
                textAlign: 'center',
                marginBottom: '32px',
                maxWidth: '800px',
              }}
            >
              {description}
            </div>

            {/* Listing Details */}
            {type === 'listing' && (price || location) && (
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  marginTop: '24px',
                }}
              >
                {price && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 32px',
                      backgroundColor: 'rgba(0, 200, 83, 0.2)',
                      borderRadius: '12px',
                      border: '2px solid rgba(0, 200, 83, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#00C853' }}>
                      {price}
                    </span>
                  </div>
                )}
                {location && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 32px',
                      backgroundColor: 'rgba(0, 229, 255, 0.2)',
                      borderRadius: '12px',
                      border: '2px solid rgba(0, 229, 255, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '24px', color: '#00E5FF' }}>
                      📍 {location}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '48px',
                padding: '12px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                fontSize: '20px',
                color: '#B0B0B0',
              }}
            >
              <span>🔒 AI-Powered Protection</span>
              <span>•</span>
              <span>✅ Verified Sellers</span>
              <span>•</span>
              <span>⚡ Instant Chat</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
