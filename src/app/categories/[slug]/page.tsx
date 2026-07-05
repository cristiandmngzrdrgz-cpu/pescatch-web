import { getDealsPaginated, getDealCountsByStore } from '@/data/queries'
import { ProductCard } from '@/components/deals/product-card'
import { SearchPagination } from '@/components/search/search-pagination'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { groupDealsByProduct } from '@/lib/group-deals'
import { CATEGORIES } from '@/types'
import type { DealFilters } from '@/types'
import Link from 'next/link'
import { Suspense } from 'react'
import { Fish, ArrowUpDown, Store, Tag } from 'lucide-react'
import type { Metadata } from 'next'
import { generateBreadcrumbSchema, generateCollectionPageSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = CATEGORIES.find(c => c.slug === slug)
  if (!category) return { title: 'Categoría no encontrada | PesCatch' }

  const canonicalUrl = `${BASE_URL}/categories/${slug}`

  return buildMetadata(
    {
      title: `${category.name} — Chollos y Ofertas | PesCatch`,
      description: category.description || `Las mejores ofertas en ${category.name.toLowerCase()} de pesca. Encuentra chollos en Amazon, Decathlon y AliExpress.`,
      openGraph: {
        title: `${category.name} — Chollos de ${category.name} | PesCatch`,
        description: category.description || `Encuentra los mejores chollos en ${category.name.toLowerCase()} de pesca.`,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category.name} — Chollos | PesCatch`,
        description: category.description || `Los mejores chollos en ${category.name.toLowerCase()} al mejor precio.`,
      },
    },
    canonicalUrl,
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
  // Resetear página al cambiar filtros para evitar páginas vacías
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sortBy?: string; store?: string; minDiscount?: string; maxPrice?: string; page?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const category = CATEGORIES.find(c => c.slug === slug)

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: '#1A2535', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}>
          <Fish className="h-8 w-8" style={{ color: '#00D4FF' }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#E8F0FE' }}>Categoría no encontrada</h1>
        <Link href="/categories" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Ver todas las categorías</Link>
      </div>
    )
  }

  const currentParams: Record<string, string> = {}
  if (sp.sortBy) currentParams.sortBy = sp.sortBy
  if (sp.store) currentParams.store = sp.store
  if (sp.minDiscount) currentParams.minDiscount = sp.minDiscount

  const page = Math.max(1, Number(sp.page) || 1)

  const filters: DealFilters = { category: category.slug }
  if (sp.sortBy && SORT_OPTIONS.some(o => o.value === sp.sortBy)) {
    filters.sortBy = sp.sortBy as DealFilters['sortBy']
  }
  if (sp.store) filters.store = sp.store
  if (sp.minDiscount) filters.minDiscount = parseInt(sp.minDiscount, 10)

  const [{ items: deals, total, totalPages }, storeCounts] = await Promise.all([
    getDealsPaginated(filters, page, PAGE_SIZE),
    getDealCountsByStore(category.slug),
  ])

  const baseUrl = `/categories/${slug}`
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Categorías', url: '/categories' },
    { name: category.name, url: `${BASE_URL}${baseUrl}` },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: `${category.name} — Chollos y Ofertas`,
    description: category.description || `Las mejores ofertas en ${category.name.toLowerCase()} de pesca.`,
    url: `${BASE_URL}${baseUrl}`,
    itemCount: deals.length,
    items: deals.map(d => ({ name: d.title, url: `${BASE_URL}/deals/${d.slug}` })),
  })

  const activeSort = sp.sortBy || 'newest'

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbs]} />
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Categorías', href: '/categories' },
          { label: category.name },
        ]} />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>{category.name}</h1>
        <p style={{ color: '#8BA3C7' }}>{category.description} &middot; {total} {total === 1 ? 'chollo disponible' : 'chollos disponibles'}{totalPages > 1 && <span> · Página {page} de {totalPages}</span>}</p>
      </div>

      {/* Subcategorías */}
      {category.subcategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 pb-6" style={{ borderBottom: '1px solid #1E3A5F' }}>
          <span className="text-sm mr-1" style={{ color: '#4A6080' }}>Subcategorías:</span>
          <Link href={buildFilterUrl(baseUrl, '', '', currentParams)}
            className="text-xs font-semibold text-[#0B1120] px-3.5 py-1.5 rounded-full transition-all duration-200"
            style={{ background: '#00D4FF', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}>
            Todo
          </Link>
          {category.subcategories.map((sub) => (
            <Link key={sub.id} href={`/categories/${category.slug}/${sub.slug}`}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
              style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid #1E3A5F' }}>
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
            {STORE_OPTIONS.map(opt => {
              const count = opt.value ? (storeCounts[opt.value] || 0) : total
              return (
                <Pill key={opt.value}
                  href={buildFilterUrl(baseUrl, 'store', opt.value, currentParams)}
                  active={(sp.store || '') === opt.value}>
                  {opt.label}
                  {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                </Pill>
              )
            })}
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
      </div>

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
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos que coincidan con los filtros seleccionados.</p>
          <Link href={`/categories/${slug}`} className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Limpiar filtros</Link>

          <div className="mt-8 pt-8" style={{ borderTop: '1px solid #1E3A5F' }}>
            <p className="text-sm mb-4" style={{ color: '#8BA3C7' }}>Explora otras categorías</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.filter(c => c.slug !== slug).slice(0, 4).map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.slug}`}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
                  style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
