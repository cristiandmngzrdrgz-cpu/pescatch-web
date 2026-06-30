import { getDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { CATEGORIES } from '@/types'
import Link from 'next/link'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Categorías de Pesca — Carretes, Cañas, Señuelos y más | PesCatch',
  description: 'Explora chollos de pesca por categoría: carretes, cañas, señuelos, accesorios, ropa y náutica. Encuentra las mejores ofertas en material de pesca en España.',
}

export default async function CategoriesPage() {
  const categoryResults = await Promise.all(CATEGORIES.map(cat => getDeals({ category: cat.slug }).then(d => [cat.slug, d] as const)))
  const categoryDeals = new Map<string, Awaited<ReturnType<typeof getDeals>>>()
  for (const [slug, deals] of categoryResults) {
    categoryDeals.set(slug, deals)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
          <Fish className="h-3 w-3" />
          Explora
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#E8F0FE' }}>Categorías</h1>
        <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Explora los chollos por tipo de material de pesca</p>
      </div>

      <div className="space-y-16">
        {CATEGORIES.map((cat) => {
          const catDeals = categoryDeals.get(cat.slug) || []

          return (
            <section key={cat.id}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#E8F0FE' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#1A2535', boxShadow: '0 0 10px rgba(0,212,255,0.08)' }}>
                      <Fish className="h-5 w-5" style={{ color: '#00D4FF' }} />
                    </div>
                    {cat.name}
                  </h2>
                  <p className="text-sm mt-1 ml-11" style={{ color: '#4A6080' }}>
                    {cat.description} &middot; {catDeals.length} {catDeals.length === 1 ? 'chollo disponible' : 'chollos disponibles'}
                  </p>
                </div>
                <Link href={`/categories/${cat.slug}`}
                  className="text-sm font-semibold transition-colors duration-200 hover:text-[#00D4FF] whitespace-nowrap flex items-center gap-1"
                  style={{ color: '#00D4FF' }}>
                  Ver todo
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </Link>
              </div>

              {cat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5 ml-11">
                  {cat.subcategories.map((sub) => (
                    <Link key={sub.id} href={`/categories/${cat.slug}/${sub.slug}`}
                      className="text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
                      style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}

              {catDeals.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {catDeals.slice(0, 4).map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center transition-all duration-200"
                  style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                  <Fish className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: '#4A6080' }} />
                  <p className="text-sm" style={{ color: '#4A6080' }}>No hay chollos en esta categoría actualmente.</p>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
