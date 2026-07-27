'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, Fish } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'
import type { Deal } from '@/types'

const FAVORITES_KEY = 'pescatch_favorites'

export default function FavoritosPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const stored = localStorage.getItem(FAVORITES_KEY)
        const ids: string[] = stored ? JSON.parse(stored) : []

        if (ids.length === 0) {
          if (!cancelled) {
            setDeals([])
            setLoading(false)
          }
          return
        }

        const res = await fetch('/api/deals/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })

        if (!cancelled && res.ok) {
          const data = await res.json()
          setDeals(data)
        }
      } catch (err) {
        console.error('Error loading favorites:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function removeFavorite(dealId: string) {
    const stored = localStorage.getItem(FAVORITES_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    const updated = ids.filter(id => id !== dealId)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
    setDeals(prev => prev.filter(d => d.id !== dealId))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>
          Mis Favoritos
        </h1>
        <div className="text-center py-12" style={{ color: '#8BA3C7' }}>
          Cargando favoritos...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>
        Mis Favoritos
      </h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7' }}>
        {deals.length === 0
          ? 'Aún no has guardado ningún chollo.'
          : `${deals.length} ${deals.length === 1 ? 'chollo guardado' : 'chollos guardados'}`}
      </p>

      {deals.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Heart className="h-16 w-16 mx-auto mb-4 opacity-30" style={{ color: '#EF4444' }} />
          <p className="text-lg font-medium mb-4" style={{ color: '#8BA3C7' }}>
            No tienes favoritos todavía
          </p>
          <p className="text-sm mb-6" style={{ color: '#4A6080' }}>
            Explora nuestros chollos y guarda los que más te interesen haciendo click en el corazón.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
              color: '#0B1120',
              boxShadow: '0 0 20px rgba(0,212,255,0.3)',
            }}
          >
            <Fish className="h-5 w-5" />
            Explorar chollos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}
            >
              <div className="flex flex-col sm:flex-row">
                <Link
                  href={`/deals/${deal.slug}`}
                  className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}
                >
                  {deal.imageUrl ? (
                    <Image
                      src={deal.imageUrl}
                      alt={deal.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 160px"
                      className="object-cover"
                    />
                  ) : (
                    <Fish className="h-10 w-10 opacity-40" style={{ color: '#00D4FF' }} />
                  )}
                  {deal.discountPercent > 0 && (
                    <div className="absolute top-3 right-3">
                      <span
                        className="inline-block font-extrabold text-xs px-2.5 py-1.5 rounded-full"
                        style={{
                          background: deal.discountPercent >= 50 ? '#FF4757' : '#FFB800',
                          color: '#0B1120',
                        }}
                      >
                        -{deal.discountPercent}%
                      </span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/deals/${deal.slug}`}>
                        <h3
                          className="font-bold text-base leading-snug line-clamp-1 transition-colors duration-300 hover:text-[#00D4FF]"
                          style={{ color: '#E8F0FE' }}
                        >
                          {deal.title}
                        </h3>
                      </Link>
                      <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>
                        {deal.store.name} · {deal.category}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFavorite(deal.id)}
                      className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10"
                      style={{ color: '#EF4444' }}
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-2xl font-extrabold" style={{ color: '#FFB800' }}>
                      {formatPrice(deal.salePrice)}
                    </span>
                    {deal.originalPrice > deal.salePrice && (
                      <span className="text-sm line-through" style={{ color: '#4A6080' }}>
                        {formatPrice(deal.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <a
                      href={deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl}
                      target="_blank"
                      rel="nofollow sponsored"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #26DE81, #1DBB6E)',
                        color: '#0B1120',
                        boxShadow: '0 0 16px rgba(38,222,129,0.3)',
                      }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Comprar en {deal.store.name}
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
