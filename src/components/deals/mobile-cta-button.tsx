'use client'

import { ShoppingCart } from 'lucide-react'
import { trackDealClick } from '@/lib/analytics'

interface MobileCtaButtonProps {
  href: string
  storeName: string
  price: string
  dealId: string
  category: string
  discountPercent: number
}

export function MobileCtaButton({ href, storeName, price, dealId, category, discountPercent }: MobileCtaButtonProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(to top, #0B1120 0%, rgba(11,17,32,0.95) 80%, transparent 100%)',
        paddingTop: '1.5rem',
      }}>
      <div className="px-4 pb-4 pt-1">
        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored"
          onClick={() => trackDealClick(dealId, storeName, category)}
          className="flex items-center justify-center gap-2 w-full h-14 font-bold text-base rounded-full transition-all duration-300 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
            color: '#0B1120',
            boxShadow: '0 4px 24px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.2)',
          }}>
          <ShoppingCart className="h-5 w-5" />
          {discountPercent >= 30 ? 'Chollazo — ' : ''}Comprar en {storeName} — {price}
        </a>
      </div>
    </div>
  )
}
