'use client'

import type { Deal } from '@/types'
import { formatPrice } from '@/lib/utils'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'
import { Store, Star, ArrowRight, BadgeCheck } from 'lucide-react'

interface PriceComparisonProps {
  deals: Deal[]
  currentDealId: string
}

function storeColor(storeId: string): string {
  switch (storeId) {
    case 'amazon': return '#FF9900'
    case 'decathlon': return '#0082C3'
    case 'aliexpress': return '#FF4747'
    default: return '#00D4FF'
  }
}

function storeIcon(storeId: string): string {
  switch (storeId) {
    case 'amazon': return 'A'
    case 'decathlon': return 'D'
    case 'aliexpress': return 'X'
    default: return storeId.charAt(0).toUpperCase()
  }
}

function storeLabel(storeId: string): string {
  switch (storeId) {
    case 'amazon': return 'Amazon'
    case 'decathlon': return 'Decathlon'
    case 'aliexpress': return 'AliExpress'
    default: return storeId
  }
}

export function PriceComparison({ deals, currentDealId }: PriceComparisonProps) {
  if (deals.length < 2) return null

  const sorted = [...deals].sort((a, b) => a.salePrice - b.salePrice)
  const cheapest = sorted[0].salePrice
  const mostExpensive = sorted[sorted.length - 1].salePrice
  const savings = mostExpensive - cheapest

  const hasRatings = sorted.some(d => d.rating != null)
  const hasOriginals = sorted.some(d => d.originalPrice > 0)

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.06)]"
      style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#E8F0FE' }}>
          <Store className="h-4 w-4" style={{ color: '#00D4FF' }} />
          Comparador de precios
          <span className="text-xs font-normal ml-auto" style={{ color: '#4A6080' }}>
            {deals.length} {deals.length === 1 ? 'tienda' : 'tiendas'}
          </span>
        </h3>
      </div>

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_90px_55px_1fr_auto] gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: '#4A6080', borderBottom: '1px solid #1E3A5F', background: 'rgba(0,0,0,0.15)' }}>
        <span>Tienda</span>
        {hasOriginals && <span className="text-right">Original</span>}
        <span className="text-right">Precio</span>
        {hasOriginals && <span className="text-center">Dto</span>}
        {hasRatings && <span>Valoración</span>}
        <span className="text-right">{''}</span>
      </div>

      <div className="divide-y" style={{ borderColor: '#1E3A5F' }}>
        {sorted.map((deal) => {
          const isCheapest = deal.salePrice === cheapest
          const isCurrent = deal.id === currentDealId
          const color = storeColor(deal.store.id)
          const savingsDiff = mostExpensive - deal.salePrice

          return (
            <a
              key={deal.id}
              href={deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored"
              className="group grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_90px_55px_1fr_auto] gap-2 px-5 py-3.5 items-center transition-all duration-200 no-underline hover:bg-[#1A2535]/50"
              style={{
                background: isCurrent ? 'rgba(0,212,255,0.03)' : undefined,
                borderLeft: isCurrent ? '2px solid #00D4FF' : '2px solid transparent',
              }}
            >
              {/* Store */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${color}18`, color }}>
                  {storeIcon(deal.store.id)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: '#E8F0FE' }}>
                    {storeLabel(deal.store.id)}
                    {deal.store.reputation === 'good' && (
                      <BadgeCheck className="h-3 w-3 flex-shrink-0" style={{ color: '#00D4FF' }} />
                    )}
                    {isCheapest && (
                      <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full ml-1"
                        style={{ background: 'rgba(38,222,129,0.15)', color: '#26DE81' }}>
                        🏆 Mejor precio
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: '#4A6080' }}>
                    {deal.shippingCost === 0 ? 'Envío gratis' : `+${formatPrice(deal.shippingCost)} envío`}
                  </div>
                </div>
              </div>

              {/* Original price */}
              {hasOriginals && (
                <div className="text-right max-sm:hidden">
                  {deal.originalPrice > 0 ? (
                    <span className="text-xs line-through" style={{ color: '#4A6080' }}>
                      {formatPrice(deal.originalPrice)}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#4A6080' }}>—</span>
                  )}
                </div>
              )}

              {/* Current price */}
              <div className="text-right">
                <div className="font-bold text-sm" style={{ color: isCheapest ? '#26DE81' : '#FFB800' }}>
                  {formatPrice(deal.salePrice)}
                </div>
                {savingsDiff > 0 && !isCheapest && (
                  <div className="text-[0.6rem] font-medium" style={{ color: '#4A6080' }}>
                    +{formatPrice(savingsDiff)}
                  </div>
                )}
              </div>

              {/* Discount */}
              {hasOriginals && (
                <div className="text-center max-sm:hidden">
                  {deal.discountPercent > 0 ? (
                    <span className="text-xs font-bold" style={{ color: '#26DE81' }}>
                      -{deal.discountPercent}%
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#4A6080' }}>—</span>
                  )}
                </div>
              )}

              {/* Rating */}
              {hasRatings && (
                <div className="flex items-center gap-1 max-sm:hidden">
                  {deal.rating != null ? (
                    <>
                      <Star className="h-3 w-3" style={{ color: '#FFB800', fill: '#FFB800' }} />
                      <span className="text-xs font-medium" style={{ color: '#8BA3C7' }}>
                        {deal.rating}
                        {deal.reviewCount != null && (
                          <span className="font-normal" style={{ color: '#4A6080' }}> ({deal.reviewCount})</span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: '#4A6080' }}>—</span>
                  )}
                </div>
              )}

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0" style={{ color: '#00D4FF' }} />
            </a>
          )
        })}
      </div>

      {/* Savings footer */}
      {savings > 0 && (
        <div className="px-5 py-3 flex items-center gap-2 text-xs" style={{ background: 'rgba(38,222,129,0.04)', borderTop: '1px solid #1E3A5F' }}>
          <span className="font-semibold" style={{ color: '#26DE81' }}>💰 Ahorra hasta {formatPrice(savings)}</span>
          <span style={{ color: '#4A6080' }}>comprando en {storeLabel(sorted[0].store.id)}</span>
        </div>
      )}
    </div>
  )
}
