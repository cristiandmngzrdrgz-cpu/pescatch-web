import Link from 'next/link'
import Image from 'next/image'
import { getDeals } from '@/data/queries'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import { CATEGORIES } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminDealsPage() {
  const deals = await getDeals({ sortBy: 'newest' })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Todos los chollos</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>{deals.length} chollos publicados</p>
        </div>
        <Link href="/admin/deals/new">
          <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo chollo
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1E3A5F', background: '#1A2535' }}>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Producto</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Cat.</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Tienda</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Precio</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Dto.</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Estado</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Fecha</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} style={{ borderBottom: '1px solid #1E3A5F' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                        {deal.imageUrl ? (
                          <Image src={deal.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold" style={{ color: '#00D4FF' }}>{deal.title[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold max-w-[200px] truncate" style={{ color: '#E8F0FE' }}>{deal.title}</div>
                        {deal.featured && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: '#0B1120', background: '#FFB800' }}>
                            DESTACADO
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: '#8BA3C7' }}>{CATEGORIES.find(c => c.id === deal.category)?.name || deal.category}</td>
                  <td className="px-5 py-3.5" style={{ color: '#8BA3C7' }}>{deal.store.name}</td>
                  <td className="px-5 py-3.5 text-right font-bold" style={{ color: '#FFB800' }}>{formatPrice(deal.salePrice)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold" style={{ color: '#EF4444' }}>-{deal.discountPercent}%</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: deal.stockStatus === 'in_stock' ? 'rgba(38,222,129,0.1)' : deal.stockStatus === 'limited' ? 'rgba(255,184,0,0.1)' : 'rgba(239,68,68,0.1)',
                        color: deal.stockStatus === 'in_stock' ? '#26DE81' : deal.stockStatus === 'limited' ? '#FFB800' : '#EF4444',
                      }}
                    >
                      {deal.stockStatus === 'in_stock' ? 'En stock' : deal.stockStatus === 'limited' ? 'Limitado' : 'Sin stock'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#4A6080' }}>{formatDate(deal.publishedAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/deals/${deal.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
