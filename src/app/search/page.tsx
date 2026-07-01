import { getDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { STORES, CATEGORIES } from '@/types'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import type { DealFilters } from '@/types'

export const dynamic = 'force-dynamic'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mas recientes' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Mas votados' },
] as const

const DISCOUNT_OPTIONS = [
  { value: '10', label: '>10%' },
  { value: '30', label: '>30%' },
  { value: '50', label: '>50%' },
] as const

const STORE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  decathlon: 'Decathlon',
  aliexpress: 'AliExpress',
  'fishing-tackle-bait': 'Fishing T&B',
  'total-fishing-tackle': 'Total Fishing',
  'pure-fishing': 'Pure Fishing',
}

function buildUrl(
  current: Record<string, string>,
  overrides: Record<string, string | undefined | null>,
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(current)) {
    if (value) sp.set(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) sp.delete(key)
    else if (value) sp.set(key, value)
    else sp.delete(key)
  }
  const qs = sp.toString()
  return qs ? `/search?${qs}` : '/search'
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
      style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#6AE8FF' }}
    >
      {label}
      <X className="h-3 w-3" style={{ color: '#6AE8FF' }} />
    </Link>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const getParam = (key: string): string => {
    const v = sp[key]
    if (!v) return ''
    return Array.isArray(v) ? v[0] : v
  }

  const query = getParam('q')
  const categoryFilter = getParam('category')
  const storeFilter = getParam('store')
  const minDiscount = getParam('minDiscount')
  const minPrice = getParam('minPrice')
  const maxPrice = getParam('maxPrice')
  const sortBy = getParam('sortBy') || 'newest'

  const currentParams: Record<string, string> = {
    q: query,
    category: categoryFilter,
    store: storeFilter,
    minDiscount,
    minPrice,
    maxPrice,
    sortBy,
  }

  const deals = await getDeals({
    search: query || undefined,
    category: categoryFilter || undefined,
    store: storeFilter || undefined,
    minDiscount: minDiscount ? Number(minDiscount) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy: sortBy as DealFilters['sortBy'],
  })

  const categoryName = categoryFilter ? CATEGORIES.find(c => c.slug === categoryFilter)?.name : null
  const storeName = storeFilter ? STORE_LABELS[storeFilter] || storeFilter : null

  const hasActiveFilters = Boolean(query || categoryFilter || storeFilter || minDiscount || minPrice || maxPrice)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#E8F0FE' }}>
            {query ? `Resultados para "${query}"` : 'Todos los chollos'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>
            {deals.length} chollo{deals.length !== 1 ? 's' : ''} encontrado{deals.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>

        {/* Store filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider mr-1 flex-shrink-0" style={{ color: '#4A6080' }}>Tienda</span>
          {STORES.map((store) => {
            const active = storeFilter === store.id
            return (
              <Link
                key={store.id}
                href={buildUrl(currentParams, { store: active ? null : store.id })}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                style={active
                  ? { background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }
                  : { background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }
                }
              >
                {STORE_LABELS[store.id] || store.name}
              </Link>
            )
          })}
          {storeFilter && (
            <Link href={buildUrl(currentParams, { store: null })} className="text-xs px-2 py-1.5" style={{ color: '#4A6080' }}>
              <X className="h-3.5 w-3.5 inline" />
            </Link>
          )}
        </div>

        {/* Discount + Sort row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider mr-1 flex-shrink-0" style={{ color: '#4A6080' }}>Dto.</span>
          {DISCOUNT_OPTIONS.map((opt) => {
            const active = minDiscount === opt.value
            return (
              <Link
                key={opt.value}
                href={buildUrl(currentParams, { minDiscount: active ? null : opt.value })}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                style={active
                  ? { background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }
                  : { background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }
                }
              >
                {opt.label}
              </Link>
            )
          })}
          {minDiscount && (
            <Link href={buildUrl(currentParams, { minDiscount: null })} className="text-xs px-2 py-1.5" style={{ color: '#4A6080' }}>
              <X className="h-3.5 w-3.5 inline" />
            </Link>
          )}

          <span className="w-px h-5 mx-2" style={{ background: '#1E3A5F' }} />

          <span className="text-xs font-semibold uppercase tracking-wider mr-1 flex-shrink-0" style={{ color: '#4A6080' }}>Orden</span>
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.value
            return (
              <Link
                key={opt.value}
                href={buildUrl(currentParams, { sortBy: opt.value })}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                style={active
                  ? { background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }
                  : { background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }
                }
              >
                {opt.label}
              </Link>
            )
          })}
        </div>

        {/* Price filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider mr-1 flex-shrink-0" style={{ color: '#4A6080' }}>Precio</span>
          <form method="GET" action="/search" className="flex items-center gap-2 flex-wrap">
            {query && <input type="hidden" name="q" defaultValue={query} />}
            {categoryFilter && <input type="hidden" name="category" defaultValue={categoryFilter} />}
            {storeFilter && <input type="hidden" name="store" defaultValue={storeFilter} />}
            {minDiscount && <input type="hidden" name="minDiscount" defaultValue={minDiscount} />}
            <input type="hidden" name="sortBy" defaultValue={sortBy} />
            <input
              type="number" name="minPrice" placeholder="Min"
              defaultValue={minPrice || ''} min="0" step="0.01"
              className="w-[72px] h-8 text-xs rounded-lg px-2.5"
              style={{ background: '#0B1120', border: '1px solid #1E3A5F', color: '#E8F0FE' }}
            />
            <span style={{ color: '#4A6080' }}>-</span>
            <input
              type="number" name="maxPrice" placeholder="Max"
              defaultValue={maxPrice || ''} min="0" step="0.01"
              className="w-[72px] h-8 text-xs rounded-lg px-2.5"
              style={{ background: '#0B1120', border: '1px solid #1E3A5F', color: '#E8F0FE' }}
            />
            <button
              type="submit"
              className="text-xs font-semibold px-3 h-8 rounded-lg transition-all"
              style={{ background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }}
            >
              Ir
            </button>
          </form>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {query && <Chip label={`"${query}"`} href={buildUrl(currentParams, { q: null })} />}
          {categoryName && <Chip label={categoryName} href={buildUrl(currentParams, { category: null })} />}
          {storeName && <Chip label={storeName} href={buildUrl(currentParams, { store: null })} />}
          {minDiscount && <Chip label={`>${minDiscount}%`} href={buildUrl(currentParams, { minDiscount: null })} />}
          {minPrice && <Chip label={`>${minPrice}€`} href={buildUrl(currentParams, { minPrice: null })} />}
          {maxPrice && <Chip label={`<${maxPrice}€`} href={buildUrl(currentParams, { maxPrice: null })} />}
        </div>
      )}

      {/* Results */}
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
            {hasActiveFilters
              ? 'Ningun chollo coincide con los filtros seleccionados. Prueba a ajustar los criterios.'
              : 'No hay chollos disponibles actualmente. Vuelve pronto.'}
          </p>
          {hasActiveFilters && (
            <Link href="/search" className="inline-flex items-center gap-2 font-semibold hover:underline text-sm transition-colors"
              style={{ color: '#00D4FF' }}>
              Limpiar filtros &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
