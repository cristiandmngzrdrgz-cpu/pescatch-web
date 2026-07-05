import { ImageResponse } from 'next/og'
import { getDealBySlug } from '@/data/queries'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const deal = await getDealBySlug(slug)

  const title = deal?.title ?? 'Chollo en PesCatch'
  const price = deal?.salePrice ? `${deal.salePrice.toFixed(2).replace('.', ',')}€` : ''
  const originalPrice = deal?.originalPrice ? `${deal.originalPrice.toFixed(2).replace('.', ',')}€` : ''
  const discount = deal?.discountPercent ?? 0
  const store = deal?.store?.name ?? ''
  const imageUrl = deal?.imageUrl ?? ''
  const brand = deal?.brand ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: 'linear-gradient(135deg, #0F1A2E 0%, #162035 50%, #1A2535 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid decoration */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(0,212,255,0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Glow accents */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,184,0,0.05) 0%, transparent 70%)',
          }}
        />

        {/* Image section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 500,
            height: 630,
            padding: '60px',
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: 450,
                objectFit: 'contain',
                borderRadius: 16,
                filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))',
              }}
            />
          ) : (
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1E3A5F',
                fontSize: 80,
                color: '#4A6080',
              }}
            >
              🎣
            </div>
          )}
        </div>

        {/* Content section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '60px 60px 60px 20px',
          }}
        >
          {/* Store badge */}
          {store && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#00D4FF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {store}
              </span>
              {brand && (
                <span style={{ fontSize: 14, color: '#4A6080', fontWeight: 500 }}>
                  {brand}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#E8F0FE',
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 24,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            {price && (
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#FFB800',
                  textShadow: '0 0 20px rgba(255,184,0,0.15)',
                }}
              >
                {price}
              </span>
            )}
            {originalPrice && (
              <span
                style={{
                  fontSize: 28,
                  color: '#4A6080',
                  textDecoration: 'line-through',
                }}
              >
                {originalPrice}
              </span>
            )}
            {discount > 0 && (
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: discount >= 50 ? '#FF4757' : '#FFB800',
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: discount >= 50
                    ? 'rgba(255,71,87,0.15)'
                    : 'rgba(255,184,0,0.15)',
                }}
              >
                -{discount}%
              </span>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 'auto',
              paddingTop: 32,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#00D4FF',
                letterSpacing: '0.02em',
              }}
            >
              PesCatch.es
            </span>
            <span style={{ fontSize: 14, color: '#4A6080' }}>
              — Chollos de material de pesca
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
