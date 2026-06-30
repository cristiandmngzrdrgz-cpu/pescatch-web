import { getDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { CATEGORIES } from '@/types'
import Link from 'next/link'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string; sub: string }> }): Promise<Metadata> {
  const { slug, sub } = await params
  const category = CATEGORIES.find(c => c.slug === slug)
  const subcategory = category?.subcategories.find(s => s.slug === sub)
  if (!category || !subcategory) return { title: 'Subcategoría no encontrada | PesCatch' }
  return {
    title: `${subcategory.name} de ${category.name} — Chollos y Ofertas | PesCatch`,
    description: `Las mejores ofertas en ${subcategory.name.toLowerCase()} de ${category.name.toLowerCase()}. Chollos en material de pesca en Amazon, Decathlon y AliExpress.`,
  }
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>
}) {
  const { slug, sub } = await params
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

  const deals = await getDeals({ category: category.slug, subcategory: sub })

  return (
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
      <p className="mb-8" style={{ color: '#8BA3C7' }}>{category.name} &middot; {deals.length} {deals.length === 1 ? 'chollo' : 'chollos'} en {subcategory.name.toLowerCase()}</p>

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
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos en esta subcategoría actualmente.</p>
          <Link href={`/categories/${category.slug}`} className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>
            Ver todos en {category.name}
          </Link>
        </div>
      )}
    </div>
  )
}
