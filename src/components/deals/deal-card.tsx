'use client'

import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Clock, Store, Truck, ChevronUp } from 'lucide-react'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Link href={`/deals/${deal.slug}`}>
      <article
        className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          background: '#0B1120',
          border: '1px solid #1E3A5F',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
          e.currentTarget.style.boxShadow = '0 0 25px rgba(0,212,255,0.2), 0 8px 32px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1E3A5F'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div className="relative h-48 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
          <img
            src={deal.imageUrl}
            alt={deal.title}
            loading="lazy"
            className="absolute inset-0 object-cover group-hover:scale-105 transition-transform duration-500 w-full h-full"
          />
          {/* Image overlay glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent 40%)' }} />
          <div className="absolute top-3 right-3">
            <span className="inline-block font-extrabold text-xs px-2.5 py-1.5 rounded-full transition-all duration-300"
              style={deal.discountPercent >= 50
                ? { background: '#FF4757', color: '#FFFFFF', boxShadow: '0 0 12px rgba(255,71,87,0.3)' }
                : { background: '#FFB800', color: '#0B1120', boxShadow: '0 0 12px rgba(255,184,0,0.25)' }
              }>
              -{deal.discountPercent}%
            </span>
          </div>
          {deal.stockStatus === 'limited' && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(255,159,67,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,159,67,0.3)',
                  color: '#FF9F43',
                }}>
                <Clock className="h-3 w-3" />
                Stock limitado
              </span>
            </div>
          )}
          {deal.stockStatus === 'out_of_stock' && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(255,71,87,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,71,87,0.3)',
                  color: '#FF4757',
                }}>
                Sin stock
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#00D4FF' }}>
            {deal.category}
          </div>
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#4A6080' }}>
            <Store className="h-3 w-3" />
            <span>{deal.store.name}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[#00D4FF]"
            style={{ color: '#E8F0FE' }}>
            {deal.title}
          </h3>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#FFB800', textShadow: '0 0 10px rgba(255,184,0,0.1)' }}>
              {formatPrice(deal.salePrice)}
            </span>
            <span className="text-sm line-through" style={{ color: '#4A6080' }}>
              {formatPrice(deal.originalPrice)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs" style={{ color: '#4A6080' }}>
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>{deal.shippingCost === 0 ? 'Envío gratis' : `Envío: ${formatPrice(deal.shippingCost)}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronUp className="h-3 w-3" style={{ color: '#26DE81' }} />
              <span style={{ color: deal.stockStatus === 'in_stock' ? '#26DE81' : deal.stockStatus === 'limited' ? '#FF9F43' : '#FF4757' }}>
                {deal.stockStatus === 'in_stock' ? 'En stock' : deal.stockStatus === 'limited' ? `Quedan ${deal.stockCount}` : 'Agotado'}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
