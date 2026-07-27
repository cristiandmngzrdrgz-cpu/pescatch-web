'use client'

import { ShoppingCart, ArrowRight } from 'lucide-react'
import { trackDealClick } from '@/lib/analytics'

interface DealCtaButtonProps {
  href: string
  storeName: string
  price: string
  dealId: string
  category: string
}

export function DealCtaButton({ href, storeName, price, dealId, category }: DealCtaButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored"
      onClick={() => trackDealClick(dealId, storeName, category)}
      className="flex items-center justify-center gap-2 w-full h-14 font-bold text-base rounded-full transition-all duration-300 glow-cta no-underline group"
      style={{
        background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
        color: '#0B1120',
        boxShadow: '0 4px 24px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.2)',
      }}>
      <ShoppingCart className="h-5 w-5" />
      Comprar en {storeName} — {price}
      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
    </a>
  )
}
