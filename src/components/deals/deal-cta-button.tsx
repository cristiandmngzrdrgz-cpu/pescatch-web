'use client'

import Link from 'next/link'
import { ShoppingCart, ArrowRight, Zap, ExternalLink, ShieldCheck, Truck, RefreshCw, Bell } from 'lucide-react'
import { trackDealClick } from '@/lib/analytics'

interface DealCtaButtonProps {
  href: string
  storeName: string
  storeId: string
  price: string
  dealId: string
  category: string
  discountPercent?: number
  shippingFree?: boolean
}

function generateClickId(): string {
  return `click_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function trackClickLocal(clickId: string, dealId: string, storeId: string) {
  try {
    await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clickId, dealId, storeId }),
      keepalive: true,
    })
  } catch {
    // Silently fail - tracking shouldn't break UX
  }
}

export function DealCtaButton({ href, storeName, storeId, price, dealId, category, discountPercent, shippingFree }: DealCtaButtonProps) {
  const isHighDiscount = discountPercent && discountPercent >= 50
  const clickId = generateClickId()
  
  // Add subId to Amazon URLs for tracking
  const trackedHref = storeId === 'amazon' && !href.includes('subId=') 
    ? `${href}${href.includes('?') ? '&' : '?'}subId=${clickId}`
    : href
  
  const handleClick = () => {
    trackDealClick(dealId, storeName, category)
    trackClickLocal(clickId, dealId, storeId)
  }
  
  return (
    <div className="flex flex-col gap-3 w-full">
      <a
        href={trackedHref}
        target="_blank"
        rel="nofollow sponsored"
        onClick={handleClick}
        className="flex flex-col items-center gap-1 w-full rounded-2xl transition-all duration-300 glow-cta no-underline group"
        style={{
          background: isHighDiscount
            ? 'linear-gradient(135deg, #FF4757, #D63031)'
            : 'linear-gradient(135deg, #00D4FF, #0099CC)',
          color: '#0B1120',
          boxShadow: isHighDiscount
            ? '0 6px 28px rgba(255,71,87,0.45), 0 0 50px rgba(255,71,87,0.25)'
            : '0 6px 28px rgba(0,212,255,0.45), 0 0 50px rgba(0,212,255,0.25)',
          padding: '1.25rem 1.5rem',
        }}>
        <div className="flex items-center justify-center gap-2 w-full">
          {isHighDiscount ? <Zap className="h-6 w-6 group-hover:scale-110 transition-transform" /> : <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />}
          <span className="flex-1 text-center font-bold text-lg">
            Ver oferta en {storeName}
          </span>
          <span className="font-extrabold text-xl bg-black/10 px-4 py-1.5 rounded-full group-hover:scale-105 transition-transform">
            {price}
          </span>
          <ExternalLink className="h-6 w-6 group-hover:translate-x-1 transition-transform opacity-80" />
        </div>
        
        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 w-full pt-2 border-t border-black/10">
          {shippingFree && (
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#26DE81' }}>
              <Truck className="h-4 w-4" />
              <span>Envío gratis</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#00D4FF' }}>
            <ShieldCheck className="h-4 w-4" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#FFB800' }}>
            <RefreshCw className="h-4 w-4" />
            <span>Devolución fácil</span>
          </div>
        </div>
      </a>
      {/* Promo funnel — 30 min/semana spec §5.5 */}
      <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)' }}>
        <span className="flex items-center gap-1.5 font-medium" style={{ color: '#8BA3C7' }}>
          <Bell className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
          ¿Baja más? Te avisamos
        </span>
        <div className="flex items-center gap-2">
          <Link href="/telegram" className="font-semibold hover:underline" style={{ color: '#00D4FF' }}>Telegram</Link>
          <span style={{ color: '#1E3A5F' }}>·</span>
          <Link href="#price-alert" onClick={(e) => { e.preventDefault(); document.getElementById('price-alert-trigger')?.click() }} className="font-semibold hover:underline" style={{ color: '#FFB800' }}>Alerta precio</Link>
        </div>
      </div>
    </div>
  )
}
