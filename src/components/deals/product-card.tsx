'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { Store, Truck, Fish, ChevronUp, Clock } from 'lucide-react'
import { CATEGORIES, STORES } from '@/types'
import type { ProductGroup } from '@/types'
import { useState } from 'react'

interface ProductCardProps {
  group: ProductGroup
}

const storeIcons: Record<string, string> = {
  amazon: 'https://m.media-amazon.com/images/G/01/gc/designs/livepreview/amazon_logo_rgb._V605225354_.png',
  decathlon: 'https://contents.mediadecathlon.com/p1965411/decathlon-logo.png',
  aliexpress: 'https://ae01.alicdn.com/kf/Sad0e0c1e3a9f4b1c8c6b7a3d4e5f6g7h/logo.png',
}

export function ProductCard({ group }: ProductCardProps) {
  const { title, slug, review, technicalSpecs, pros, imageUrl, deals, bestPrice, bestStore, storeCount, discountPercent } = group
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(imageUrl) && !imgError

  const specs = Object.entries(technicalSpecs).slice(0, 4)
  const reviewSnippet = review ? review.slice(0, 150) + (review.length > 150 ? '...' : '') : ''

  return (
    <Link href={`/deals/${slug}`} className="block">
      <article
        className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          background: '#0B1120',
          border: '1px solid #1E3A5F',
        }}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 flex items-center justify-center overflow-hidden"
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
          </div>

          <div className="flex-1 min-w-0 p-5">
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

            {/* Store price comparison */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {deals.slice(0, 3).map((deal) => {
                const storeMeta = STORES.find(s => s.id === deal.store.id || s.name === deal.store.name)
                const isCheapest = deal.salePrice === bestPrice
                const storeSlug = storeMeta?.slug || deal.store.slug || deal.store.id
                return (
                  <div key={deal.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: isCheapest ? 'rgba(38,222,129,0.08)' : '#1A2535',
                      border: `1px solid ${isCheapest ? 'rgba(38,222,129,0.3)' : '#1E3A5F'}`,
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: storeMeta?.reputation === 'good' ? 'rgba(0,212,255,0.1)' : 'rgba(255,159,67,0.1)' }}>
                      <Store className="h-3 w-3" style={{ color: isCheapest ? '#26DE81' : '#00D4FF' }} />
                    </div>
                    <span style={{ color: isCheapest ? '#26DE81' : '#8BA3C7' }} className="font-semibold">
                      {storeMeta?.name || deal.store.name}
                    </span>
                    <span className="font-bold" style={{ color: isCheapest ? '#26DE81' : '#FFB800' }}>
                      {formatPrice(deal.salePrice)}
                    </span>
                    {isCheapest && storeCount > 1 && (
                      <span className="text-[0.55rem] font-bold px-1 py-0.5 rounded"
                        style={{ background: 'rgba(38,222,129,0.2)', color: '#26DE81' }}>
                        MEJOR
                      </span>
                    )}
                    {deal.shippingCost === 0 && storeCount === 1 && (
                      <Truck className="h-3 w-3" style={{ color: '#4A6080' }} />
                    )}
                  </div>
                )
              })}
              {deals.length > 3 && (
                <span className="text-xs font-medium" style={{ color: '#4A6080' }}>
                  +{deals.length - 3} más
                </span>
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
    </Link>
  )
}
