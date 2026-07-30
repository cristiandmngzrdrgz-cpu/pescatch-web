'use client'

import { ShoppingCart, ArrowRight, Zap } from 'lucide-react'
import { trackDealClick } from '@/lib/analytics'

interface DealCtaButtonProps {
  href: string
  storeName: string
  price: string
  dealId: string
  category: string
  discountPercent?: number
  shippingFree?: boolean
}

export function DealCtaButton({ href, storeName, price, dealId, category, discountPercent, shippingFree }: DealCtaButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored"
      onClick={() => trackDealClick(dealId, storeName, category)}
      className="flex items-center justify-center gap-2 w-full h-14 font-bold text-base rounded-full transition-all duration-300 glow-cta no-underline group"
      style={{
        background: discountPercent && discountPercent >= 50
          ? 'linear-gradient(135deg, #FF4757, #D63031)'
          : 'linear-gradient(135deg, #00D4FF, #0099CC)',
        color: '#0B1120',
        boxShadow: discountPercent && discountPercent >= 50
          ? '0 4px 24px rgba(255,71,87,0.4), 0 0 40px rgba(255,71,87,0.2)'
          : '0 4px 24px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.2)',
      }}>
      {discountPercent && discountPercent >= 50 ? <Zap className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
      <span className="flex items-center gap-1.5">
        Comprar en {storeName}
      </span>
      <span className="font-extrabold">{price}</span>
      {shippingFree && <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(11,17,32,0.2)' }}>Envío gratis</span>}
      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
    </a>
  )
}
