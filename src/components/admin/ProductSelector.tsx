'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Check, X, ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Deal } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductSelectorProps {
  open: boolean
  onClose: () => void
  onConfirm: (productsData: ProductSelectEntry[]) => void
}

export interface ProductSelectEntry {
  title: string
  price: string
  rating: number
  image: string
  scores: Record<string, number>
  asin?: string
  slug: string
}

export default function ProductSelector({ open, onClose, onConfirm }: ProductSelectorProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    fetch('/api/deals?includeHidden=true')
      .then(r => r.json())
      .then((data: Deal[]) => {
        setDeals(data.filter(d => d.status === 'published'))
      })
  }, [open])

  const loading = open && deals.length === 0

  const filtered = deals.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.store.name.toLowerCase().includes(q) ||
      (d.ean && d.ean.includes(q)) ||
      (d.asin && d.asin.toLowerCase().includes(q)) ||
      (d.brand && d.brand.toLowerCase().includes(q))
    )
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const entries: ProductSelectEntry[] = []
    for (const id of selected) {
      const deal = deals.find(d => d.id === id)
      if (!deal) continue
      entries.push({
        title: deal.title,
        price: formatPrice(deal.salePrice),
        rating: deal.rating || 0,
        image: deal.imageUrl,
        scores: {},
        asin: deal.asin || undefined,
        slug: deal.slug,
      })
    }
    onConfirm(entries)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#111827', border: '1px solid #1E3A5F' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1E3A5F' }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#E8F0FE' }}>Insertar productos</h3>
            <p className="text-xs mt-0.5" style={{ color: '#8BA3C7' }}>
              {selected.size > 0 ? `${selected.size} seleccionados` : 'Selecciona los chollos a insertar en el artículo'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl" style={{ color: '#8BA3C7' }} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4" style={{ borderBottom: '1px solid #1E3A5F' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4A6080' }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, categoría, marca..."
              className="pl-9 h-10 rounded-xl"
              style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#00D4FF' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3" style={{ color: '#4A6080' }} />
              <p className="text-sm font-medium" style={{ color: '#8BA3C7' }}>No se encontraron chollos</p>
            </div>
          ) : (
            filtered.map(deal => {
              const isSelected = selected.has(deal.id)
              return (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => toggleSelect(deal.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 text-left border"
                  style={{
                    background: isSelected ? 'rgba(0,212,255,0.06)' : '#0B1120',
                    borderColor: isSelected ? 'rgba(0,212,255,0.3)' : '#1E3A5F',
                  }}
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center" style={{ background: '#1A2535' }}>
                    {deal.imageUrl ? (
                      <Image src={deal.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: '#00D4FF' }}>{deal.title[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#E8F0FE' }}>{deal.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#8BA3C7' }}>{deal.store.name}</span>
                      <span className="font-bold text-xs" style={{ color: '#FFB800' }}>{formatPrice(deal.salePrice)}</span>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${isSelected ? 'border-transparent' : ''}`}
                    style={{
                      background: isSelected ? '#00D4FF' : 'transparent',
                      borderColor: isSelected ? 'transparent' : '#1E3A5F',
                    }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" style={{ color: '#0B1120' }} />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-3 p-5" style={{ borderTop: '1px solid #1E3A5F' }}>
          <Button variant="outline" onClick={onClose} className="h-10 px-5 rounded-xl flex-1" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0} className="h-10 px-5 rounded-xl flex-1 font-semibold" style={{ background: '#00D4FF', color: '#0B1120' }}>
            Insertar ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  )
}
