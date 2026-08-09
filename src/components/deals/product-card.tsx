'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'
import { trackDealClick } from '@/lib/analytics'
import { Store, Truck, Fish, ChevronUp, Clock, Star, ShoppingCart, Zap } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { CATEGORIES, STORES } from '@/types'
import type { ProductGroup } from '@/types'
import { useState } from 'react'

interface ProductCardProps {
  group: ProductGroup
}

const storeIcons: Record<string, string> = {
  amazon: 'https://m.media-amazon.com/images/G/01/gc/designs/livepreview/amazon_logo_rgb._V605225354_.png',
  aliexpress: 'https://ae01.alicdn.com/kf/Sad0e0c1e3a9f4b1c8c6b7a3d4e5f6g7h/logo.png',
}

const storeLabel: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
}

export function ProductCard({ group }: ProductCardProps) {
  const { title, slug, review, technicalSpecs, pros, imageUrl, deals, bestPrice, bestStore, storeCount, discountPercent } = group
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(imageUrl) && !imgError

  const specs = Object.entries(technicalSpecs).slice(0, 4)
  const reviewSnippet = review ? review.slice(0, 150) + (review.length > 150 ? '...' : '') : ''

  return (
    <article
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#0B1120',
        border: '1px solid #1E3A5F',
      }}
    >
      <div className="flex flex-col sm:flex-row">
        <Link href={`/deals/${slug}`} className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              onError={() => setImgError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <Fish className="h-10 w-10" style={{ color: '#00D4FF' }} />
              <span className="text-xs font-medium" style={{ color: '#4A6080' }}>Sin imagen</span>
            </div>
          )}
          {discountPercent > 0 && (
            <div className="absolute top-3 right-3">
              <span className="inline-block font-extrabold text-xs px-2.5 py-1.5 rounded-full"
                style={{
                  background: discountPercent >= 50 ? '#FF4757' : '#FFB800',
                  color: '#0B1120',
                  boxShadow: discountPercent >= 50 ? '0 0 12px rgba(255,71,87,0.3)' : '0 0 12px rgba(255,184,0,0.25)',
                }}>
                -{discountPercent}%
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 p-5">
          <Link href={`/deals/${slug}`}>
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#00D4FF' }}>
              {CATEGORIES.find(c => c.id === group.category)?.name || group.category}
            </div>
            <h3 className="font-bold text-base leading-snug line-clamp-1 transition-colors duration-300 group-hover:text-[#00D4FF]"
              style={{ color: '#E8F0FE' }}>
              {title}
            </h3>

            {reviewSnippet && (
              <p className="text-sm mt-2 leading-relaxed line-clamp-2" style={{ color: '#8BA3C7' }}>
                {reviewSnippet}
              </p>
            )}

            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {specs.map(([key, value]) => (
                  <span key={key}
                    className="inline-flex items-center text-[0.6rem] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#1A2535', color: '#4A6080', border: '1px solid #1E3A5F' }}>
                    {key}: <span className="ml-0.5 font-semibold" style={{ color: '#00D4FF' }}>{value}</span>
                  </span>
                ))}
              </div>
            )}

            {pros.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#26DE81' }}>
                <ChevronUp className="h-3 w-3" />
                {pros.slice(0, 2).map((p, i) => (
                  <span key={i} className="truncate max-w-[120px]">{p}</span>
                ))}
                {pros.length > 2 && <span style={{ color: '#4A6080' }}>+{pros.length - 2}</span>}
              </div>
            )}

            {(() => {
              const ratedDeal = deals.find(d => d.rating)
              return ratedDeal ? (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-3.5 w-3.5" style={{ color: '#FFB800', fill: '#FFB800' }} />
                  <span className="text-xs font-medium" style={{ color: '#8BA3C7' }}>
                    {ratedDeal.rating}{ratedDeal.reviewCount ? ` · ${ratedDeal.reviewCount} valoraciones` : ''}
                  </span>
                </div>
              ) : null
            })()}
          </Link>

          {/* Store CTA buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {deals.slice(0, 3).map((deal) => {
              const storeMeta = STORES.find(s => s.id === deal.store.id || s.name === deal.store.name)
              const isCheapest = deal.salePrice === bestPrice
              const label = storeMeta?.name || storeLabel[deal.store.id] || deal.store.name
              return (
                <a key={deal.id}
                  href={deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl}
                  target="_blank"
                  rel="nofollow sponsored"
                  onClick={(e) => {
                    e.stopPropagation()
                    trackDealClick(deal.id, deal.store.name, group.category)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    background: isCheapest
                      ? 'linear-gradient(135deg, #26DE81, #1DBB6E)'
                      : '#1A2535',
                    border: `1px solid ${isCheapest ? 'rgba(38,222,129,0.4)' : '#1E3A5F'}`,
                    color: isCheapest ? '#0B1120' : '#E8F0FE',
                    boxShadow: isCheapest ? '0 0 16px rgba(38,222,129,0.3), 0 0 30px rgba(38,222,129,0.1)' : 'none',
                    animation: isCheapest ? 'pulse-cta 2s ease-in-out infinite' : 'none',
                  }}>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span className="max-sm:hidden">Comprar en </span>
                  <span>{label}</span>
                  <span className="font-extrabold" style={{ color: isCheapest ? '#0B1120' : '#FFB800' }}>
                    {formatPrice(deal.salePrice)}
                  </span>
                  {isCheapest && storeCount > 1 && (
                    <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(11,17,32,0.3)', color: '#0B1120' }}>
                      MEJOR
                    </span>
                  )}
                </a>
              )
            })}
            {deals.length > 3 && (
              <Link href={`/deals/${slug}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:bg-[#1A2535]"
                style={{ border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
                +{deals.length - 3} más
              </Link>
            )}
          </div>

          {storeCount > 1 && (
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#4A6080' }}>
              <Store className="h-3 w-3" />
              <span>Disponible en {storeCount} tiendas · Mejor precio: <strong style={{ color: '#26DE81' }}>{formatPrice(bestPrice)}</strong> en {bestStore}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
