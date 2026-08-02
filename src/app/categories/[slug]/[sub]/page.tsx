import { getDealsPaginated } from '@/data/queries'
import { ProductCard } from '@/components/deals/product-card'
import { SearchPagination } from '@/components/search/search-pagination'
import { PriceRangeSlider } from '@/components/search/price-range-slider'
import { FilterDrawer } from '@/components/search/filter-drawer'
import { groupDealsByProduct } from '@/lib/group-deals'
import { CATEGORIES } from '@/types'
import type { DealFilters } from '@/types'
import Link from 'next/link'
import { Suspense } from 'react'
import { Fish, ArrowUpDown, Store, Tag, X } from 'lucide-react'
import type { Metadata } from 'next'
import { buildMetadata, BASE_URL, generateBreadcrumbSchema, generateCollectionPageSchema, JsonLd } from '@/lib/seo/schemas'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export async function generateMetadata({ params }: { params: Promise<{ slug: string; sub: string }> }): Promise<Metadata> {
  const { slug, sub } = await params
  const category = CATEGORIES.find(c => c.slug === slug)
  const subcategory = category?.subcategories.find(s => s.slug === sub)
  if (!category || !subcategory) return { title: 'Subcategoría no encontrada | PesCatch' }
  const title = `${subcategory.name} de ${category.name} — Chollos y Ofertas | PesCatch`
  const description = `Las mejores ofertas en ${subcategory.name.toLowerCase()} de ${category.name.toLowerCase()}. Chollos en material de pesca en Amazon, Decathlon y AliExpress.`
  const canonicalUrl = `${BASE_URL}/categories/${slug}/${sub}`
  return buildMetadata(
    {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonicalUrl,
      },
    },
    canonicalUrl
  )
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'popular', label: 'Más populares' },
] as const

const DISCOUNT_OPTIONS = [
  { value: '', label: 'Cualquier descuento' },
  { value: '10', label: 'Desde 10%' },
  { value: '20', label: 'Desde 20%' },
  { value: '30', label: 'Desde 30%' },
  { value: '50', label: 'Desde 50%' },
] as const

const STORE_OPTIONS = [
  { value: '', label: 'Todas las tiendas' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'decathlon', label: 'Decathlon' },
  { value: 'aliexpress', label: 'AliExpress' },
] as const

function buildFilterUrl(base: string, key: string, value: string, current: Record<string, string>): string {
  const params = new URLSearchParams(current)
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
  params.delete('page')
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${active ? 'text-[#0B1120] font-semibold' : 'hover:border-[#00D4FF]/50 hover:text-[#00D4FF]'}`}
      style={active ? { background: '#00D4FF', boxShadow: '0 0 12px rgba(0,212,255,0.3)' } : { background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
      {children}
    </Link>
  )
}

function ActiveChip({ label, href }: { label: string; href: string }) {
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

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; sub: string }>
  searchParams: Promise<{ sortBy?: string; store?: string; minDiscount?: string; minPrice?: string; maxPrice?: string; page?: string }>
}) {
  const { slug, sub } = await params
  const sp = await searchParams
  const category = CATEGORIES.find(c => c.slug === slug)
  const subcategory = category?.subcategories.find(s => s.slug === sub)

  if (!category || !subcategory) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: '#1A2535', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}>
          <Fish className="h-8 w-8" style={{ color: '#00D4FF' }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#E8F0FE' }}>Subcategoría no encontrada</h1>
        <Link href="/categories" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Ver todas las categorías</Link>
      </div>
    )
  }

  const currentParams: Record<string, string> = {}
  if (sp.sortBy) currentParams.sortBy = sp.sortBy
  if (sp.store) currentParams.store = sp.store
  if (sp.minDiscount) currentParams.minDiscount = sp.minDiscount
  if (sp.minPrice) currentParams.minPrice = sp.minPrice
  if (sp.maxPrice) currentParams.maxPrice = sp.maxPrice

  const page = Math.max(1, Number(sp.page) || 1)

  const filters: DealFilters = { category: category.slug, subcategory: sub }
  if (sp.sortBy && SORT_OPTIONS.some(o => o.value === sp.sortBy)) {
    filters.sortBy = sp.sortBy as DealFilters['sortBy']
  }
  if (sp.store) filters.store = sp.store
  if (sp.minDiscount) filters.minDiscount = parseInt(sp.minDiscount, 10)
  if (sp.minPrice) filters.minPrice = parseInt(sp.minPrice, 10)
  if (sp.maxPrice) filters.maxPrice = parseInt(sp.maxPrice, 10)

  const { items: deals, total, totalPages } = await getDealsPaginated(filters, page, PAGE_SIZE)

  const baseUrl = `/categories/${slug}/${sub}`
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Categorías', url: '/categories' },
    { name: category.name, url: `/categories/${category.slug}` },
    { name: subcategory.name, url: `${BASE_URL}${baseUrl}` },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: `${subcategory.name} de ${category.name}`,
    description: `Ofertas en ${subcategory.name.toLowerCase()} de ${category.name.toLowerCase()}`,
    url: `${BASE_URL}${baseUrl}`,
    itemCount: deals.length,
  })

  const activeSort = sp.sortBy || 'newest'
  const activeFilters = [sp.store, sp.minDiscount, sp.minPrice, sp.maxPrice].filter(Boolean).length
  const clearFiltersUrl = buildFilterUrl(baseUrl, '', '', {})

  return (
    <>
      <JsonLd data={[breadcrumbs, collectionSchema]} />
      <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex items-center gap-2 text-sm mb-6 overflow-x-auto whitespace-nowrap" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href="/categories" className="hover:text-[#00D4FF] transition-colors">Categorías</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href={`/categories/${category.slug}`} className="hover:text-[#00D4FF] transition-colors">{category.name}</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <span className="font-medium" style={{ color: '#E8F0FE' }}>{subcategory.name}</span>
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>{subcategory.name}</h1>
      <p className="mb-6" style={{ color: '#8BA3C7' }}>{category.name} &middot; {total} {total === 1 ? 'chollo' : 'chollos'} en {subcategory.name.toLowerCase()}</p>

      {/* Filtros */}
      <FilterDrawer activeCount={activeFilters}>
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5" style={{ color: '#4A6080' }} />
              <span className="text-xs mr-1" style={{ color: '#4A6080' }}>Ordenar:</span>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map(opt => (
                  <Pill key={opt.value}
                    href={buildFilterUrl(baseUrl, 'sortBy', opt.value, currentParams)}
                    active={activeSort === opt.value}>
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Store */}
            <div className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5" style={{ color: '#4A6080' }} />
              <span className="text-xs mr-1" style={{ color: '#4A6080' }}>Tienda:</span>
              <div className="flex flex-wrap gap-1.5">
                {STORE_OPTIONS.map(opt => (
                  <Pill key={opt.value}
                    href={buildFilterUrl(baseUrl, 'store', opt.value, currentParams)}
                    active={(sp.store || '') === opt.value}>
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" style={{ color: '#4A6080' }} />
              <span className="text-xs mr-1" style={{ color: '#4A6080' }}>Descuento:</span>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_OPTIONS.map(opt => (
                  <Pill key={opt.value}
                    href={buildFilterUrl(baseUrl, 'minDiscount', opt.value, currentParams)}
                    active={(sp.minDiscount || '') === opt.value}>
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-xs mr-1" style={{ color: '#4A6080' }}>Precio:</span>
              <Suspense fallback={<div className="w-full max-w-xs h-5" />}>
                <PriceRangeSlider min={0} max={500} step={5} basePath={baseUrl} />
              </Suspense>
            </div>
          </div>
        </div>
      </FilterDrawer>

      {/* Filtros activos */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {sp.store && <ActiveChip label={STORE_OPTIONS.find(o => o.value === sp.store)?.label || sp.store} href={buildFilterUrl(baseUrl, 'store', '', currentParams)} />}
          {sp.minDiscount && <ActiveChip label={`Desde ${sp.minDiscount}%`} href={buildFilterUrl(baseUrl, 'minDiscount', '', currentParams)} />}
          {sp.minPrice && <ActiveChip label={`Desde ${sp.minPrice}€`} href={buildFilterUrl(baseUrl, 'minPrice', '', currentParams)} />}
          {sp.maxPrice && <ActiveChip label={`Hasta ${sp.maxPrice}€`} href={buildFilterUrl(baseUrl, 'maxPrice', '', currentParams)} />}
          <Link href={clearFiltersUrl} className="text-xs font-medium px-3 py-1.5 hover:underline" style={{ color: '#4A6080' }}>
            Limpiar filtros
          </Link>
        </div>
      )}

      {deals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {groupDealsByProduct(deals).map((group) => (
              <ProductCard key={group.productId || group.slug} group={group} />
            ))}
          </div>
          <Suspense>
            <SearchPagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath={baseUrl}
            />
          </Suspense>
        </>
      ) : (
        <div className="text-center py-16 rounded-2xl transition-all duration-200"
          style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Fish className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: '#4A6080' }} />
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos en esta subcategoría actualmente.</p>
          <Link href={clearFiltersUrl} className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>
            Ver todos en {category.name}
          </Link>
        </div>
      )}
    </div>
    </>
  )
}
