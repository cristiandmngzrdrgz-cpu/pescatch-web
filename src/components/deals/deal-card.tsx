'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'
import { trackDealClick } from '@/lib/analytics'
import { Clock, Store, Truck, ChevronUp, Fish, Star, ShoppingCart, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { CATEGORIES, STORES } from '@/types'
import type { Deal } from '@/types'
import { useState } from 'react'

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
    // Silently fail
  }
}

interface DealCardProps {
  deal: Deal
  bestPriceStore?: string | null
  storeCount?: number
}

const storeLabel: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
}

export function DealCard({ deal, bestPriceStore, storeCount }: DealCardProps) {
  const isBestPrice = bestPriceStore != null && deal.store.name === bestPriceStore
  const showBestPrice = storeCount != null && storeCount >= 2
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(deal.imageUrl) && !imgError
  const storeMeta = STORES.find(s => s.id === deal.store.id || s.name === deal.store.name)
  const label = storeMeta?.name || storeLabel[deal.store.id] || deal.store.name

  const clickId = generateClickId()
  const baseHref = deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl
  const trackedHref = deal.store.id === 'amazon' && !baseHref.includes('subId=')
    ? `${baseHref}${baseHref.includes('?') ? '&' : '?'}subId=${clickId}`
    : baseHref

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    trackDealClick(deal.id, deal.store.name, deal.category)
    trackClickLocal(clickId, deal.id, deal.store.id)
  }

  return (
    <article
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,212,255,0.5)] hover:shadow-[0_0_25px_rgba(0,212,255,0.2),0_8px_32px_rgba(0,0,0,0.4)]"
      style={{
        background: '#0B1120',
        border: '1px solid #1E3A5F',
      }}
    >
      <Link href={`/deals/${deal.slug}`}>
        <div className="relative h-48 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
          {hasImage ? (
            <Image
              src={deal.imageUrl}
              alt={deal.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <Fish className="h-10 w-10" style={{ color: '#00D4FF' }} />
              <span className="text-xs font-medium" style={{ color: '#4A6080' }}>Sin imagen</span>
            </div>
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent 40%)' }} />
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {/* Verified badge - show for AliExpress deals (manually verified prices) */}
            {deal.store.id === 'aliexpress' && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(38,222,129,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(38,222,129,0.4)',
                  color: '#26DE81',
                }}>
                <CheckCircle2 className="h-2.5 w-2.5" />
                Verificado
              </span>
            )}
            {showBestPrice && isBestPrice && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(0,212,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,212,255,0.5)',
                  color: '#00D4FF',
                }}>
                <Store className="h-2.5 w-2.5" />
                Mejor Precio
              </span>
            )}
            {deal.discountPercent > 0 && (
              <span className="inline-block font-extrabold text-xs px-2.5 py-1.5 rounded-full transition-all duration-300"
                style={deal.discountPercent >= 50
                  ? { background: '#FF4757', color: '#FFFFFF', boxShadow: '0 0 12px rgba(255,71,87,0.3)' }
                  : { background: '#FFB800', color: '#0B1120', boxShadow: '0 0 12px rgba(255,184,0,0.25)' }
                }>
                -{deal.discountPercent}%
              </span>
            )}
          </div>
          {deal.stockStatus === 'limited' && (
            <div className="absolute top-3 left-3">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent side="top">Quedan pocas unidades, date prisa</TooltipContent>
              </Tooltip>
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
            {CATEGORIES.find(c => c.id === deal.category)?.name || deal.category}
          </div>
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#4A6080' }}>
            <a
              href={baseHref}
              target="_blank"
              rel="nofollow sponsored"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 hover:text-[#00D4FF] transition-colors duration-200"
            >
              <Store className="h-3 w-3" />
              <span>{deal.store.name}</span>
            </a>
            {deal.brand && (
              <>
                <span className="mx-0.5" style={{ color: '#1E3A5F' }}>·</span>
                <Link href={`/marca/${deal.brand.toLowerCase().replace(/\s+/g, '-')}`}
                  className="hover:text-[#00D4FF] transition-colors duration-200 font-medium"
                  style={{ color: '#8BA3C7' }}
                  onClick={(e) => e.stopPropagation()}>
                  {deal.brand}
                </Link>
              </>
            )}
            {showBestPrice && !isBestPrice && bestPriceStore && (
              <>
                <span className="mx-0.5" style={{ color: '#1E3A5F' }}>·</span>
                <span style={{ color: '#FFB800' }}>Más barato en {bestPriceStore}</span>
              </>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[#00D4FF]"
            style={{ color: '#E8F0FE' }}>
            {deal.title}
          </h3>
          {deal.rating && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-3.5 w-3.5" style={{ color: '#FFB800', fill: '#FFB800' }} />
              <span className="text-xs font-medium" style={{ color: '#8BA3C7' }}>
                {deal.rating}{deal.reviewCount ? ` · ${deal.reviewCount} valoraciones` : ''}
              </span>
            </div>
          )}
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#FFB800', textShadow: '0 0 10px rgba(255,184,0,0.1)' }}>
              {formatPrice(deal.salePrice)}
            </span>
            <span className="text-sm line-through" style={{ color: '#4A6080' }}>
              {formatPrice(deal.originalPrice)}
            </span>
          </div>
        </div>
      </Link>

      {/* Direct buy CTA */}
      <div className="px-5 pb-5 pt-0">
        <a
          href={trackedHref}
          target="_blank"
          rel="nofollow sponsored"
          onClick={handleClick}
          className="flex items-center justify-center gap-2 w-full h-12 font-bold text-sm rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 group"
          style={{
            background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
            color: '#0B1120',
            boxShadow: '0 4px 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.15)',
          }}>
          <ShoppingCart className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          <span className="flex-1 text-left">
            Ver oferta en {label}
          </span>
          <span className="font-extrabold text-lg bg-black/10 px-3 py-1 rounded-full">
            {formatPrice(deal.salePrice)}
          </span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </a>
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: '#4A6080' }}>
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
  )
}