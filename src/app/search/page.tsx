import { getDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { Search, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mas recientes' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Mas votados' },
] as const

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sortBy?: string }>
}) {
  const sp = await searchParams
  const query = sp.q || ''
  const categoryFilter = sp.category || ''
  const sortBy = (sp.sortBy as string) || 'newest'

  const deals = await getDeals({
    search: query || undefined,
    category: categoryFilter || undefined,
    sortBy: sortBy as 'newest' | 'discount' | 'price_asc' | 'price_desc' | 'popular',
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>
        {query ? `Resultados para "${query}"` : 'Todos los chollos'}
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#8BA3C7' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', boxShadow: '0 0 10px rgba(0,212,255,0.1)' }}>
            <Search className="h-4 w-4" style={{ color: '#00D4FF' }} />
          </div>
          <span className="font-medium">{deals.length} chollos encontrados</span>
          {query && <span style={{ color: '#4A6080' }}>para &quot;{query}&quot;</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 flex-shrink-0" style={{ color: '#4A6080' }} />
          {SORT_OPTIONS.map((opt) => {
            const href = new URLSearchParams()
            if (query) href.set('q', query)
            if (categoryFilter) href.set('category', categoryFilter)
            href.set('sortBy', opt.value)
            const active = sortBy === opt.value

            return (
              <Link
                key={opt.value}
                href={`/search?${href.toString()}`}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-[#00D4FF]/30 hover:text-[#00D4FF]"
                style={active
                  ? { background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }
                  : { background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }
                }
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Search className="h-12 w-12 mx-auto mb-4" style={{ color: '#4A6080' }} />
          <p className="text-lg mb-2" style={{ color: '#8BA3C7' }}>No se encontraron chollos</p>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: '#4A6080' }}>
            {query
              ? `No hay resultados para "${query}". Prueba con otros terminos o explora las categorias.`
              : 'No hay chollos disponibles actualmente. Vuelve pronto.'}
          </p>
          <Link href="/search" className="inline-flex items-center gap-2 font-semibold hover:underline text-sm transition-colors"
            style={{ color: '#00D4FF' }}>
            Ver todos los chollos &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
