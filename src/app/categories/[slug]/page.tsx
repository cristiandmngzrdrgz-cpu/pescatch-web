import { getDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { CATEGORIES } from '@/types'
import Link from 'next/link'
import { Fish } from 'lucide-react'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  const deals = await getDeals({ category: category.slug })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <Link href="/categories" className="text-sm transition-colors duration-200 hover:text-[#00D4FF] mb-3 inline-block"
          style={{ color: '#4A6080' }}>
          &larr; Todas las categorías
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>{category.name}</h1>
        <p style={{ color: '#8BA3C7' }}>{category.description} &middot; {deals.length} {deals.length === 1 ? 'chollo disponible' : 'chollos disponibles'}</p>
      </div>

      {category.subcategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-6" style={{ borderBottom: '1px solid #1E3A5F' }}>
          <span className="text-sm mr-2" style={{ color: '#4A6080' }}>Filtrar por:</span>
          <Link href={`/categories/${category.slug}`}
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

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl transition-all duration-200"
          style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Fish className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: '#4A6080' }} />
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos en esta categoría actualmente.</p>
          <Link href="/" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Volver al inicio</Link>
        </div>
      )}
    </div>
  )
}
