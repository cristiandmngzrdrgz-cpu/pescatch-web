'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Deal } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, ShoppingBag, Search, ExternalLink, Check, X } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import Pagination from '@/components/admin/Pagination'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const PAGE_SIZE = 25

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetch('/api/deals?includeHidden=true')
      .then(r => r.json())
      .then((data: Deal[]) => setDeals(data))
      .finally(() => setLoading(false))
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSelectedIds(new Set())
    setPage(1)
  }

  const handleCategoryFilterChange = (value: string | null) => {
    setCategoryFilter(value ?? 'all')
    setSelectedIds(new Set())
    setPage(1)
  }

  const handleStoreFilterChange = (value: string | null) => {
    setStoreFilter(value ?? 'all')
    setSelectedIds(new Set())
    setPage(1)
  }

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value ?? 'all')
    setSelectedIds(new Set())
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setSelectedIds(new Set())
  }

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/deals/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeals(prev => prev.filter(d => d.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.title}" eliminado`)
    } else {
      toast.error('Error al eliminar')
    }
  }, [deleteTarget])

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setDeals(prev => prev.map(d => d.id === id ? updated : d))
      toast.success(newStatus === 'published' ? 'Chollo publicado' : 'Chollo en borrador')
    } else {
      toast.error('Error al actualizar')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (action === 'delete') {
      setConfirmBulkDelete(true)
      return
    }
    setBulkLoading(true)
    setBulkAction(action)
    try {
      const res = await fetch('/api/deals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        if (action === 'delete') {
          setDeals(prev => prev.filter(d => !selectedIds.has(d.id)))
        } else if (action === 'publish') {
          setDeals(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, status: 'published' } : d))
        } else if (action === 'draft') {
          setDeals(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, status: 'draft' } : d))
        }
        toast.success(`${selectedIds.size} chollos actualizados`)
        setSelectedIds(new Set())
      } else {
        toast.error('Error en la acción en lote')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setBulkLoading(false)
      setBulkAction(null)
    }
  }

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.ean?.includes(searchTerm) ||
                         deal.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || deal.category === categoryFilter
    const matchesStore = storeFilter === 'all' || deal.store.id === storeFilter
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'draft' && deal.status === 'draft') ||
                         (statusFilter === 'published' && deal.status === 'published') ||
                         (statusFilter === 'featured' && deal.featured)
    return matchesSearch && matchesCategory && matchesStore && matchesStatus
  })

  const totalFiltered = filteredDeals.length
  const pagedDeals = filteredDeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allSelected = pagedDeals.length > 0 && pagedDeals.every(d => selectedIds.has(d.id))

  const uniqueStores = Array.from(new Set(deals.map(deal => deal.store.id)))
    .map(storeId => deals.find(deal => deal.store.id === storeId)!.store)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#00D4FF', borderRightColor: '#00D4FF' }} />
      </div>
    )
  }

  return (
    <div>
      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar chollo"
        description={`¿Estás seguro de eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
      />

      <ConfirmDelete
        open={confirmBulkDelete}
        onOpenChange={() => setConfirmBulkDelete(false)}
        onConfirm={async () => {
          setConfirmBulkDelete(false)
          setBulkLoading(true)
          setBulkAction('delete')
          try {
            const res = await fetch('/api/deals/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
            })
            if (res.ok) {
              setDeals(prev => prev.filter(d => !selectedIds.has(d.id)))
              toast.success(`${selectedIds.size} chollos eliminados`)
              setSelectedIds(new Set())
            } else {
              toast.error('Error al eliminar en lote')
            }
          } catch {
            toast.error('Error de conexión')
          } finally {
            setBulkLoading(false)
            setBulkAction(null)
          }
        }}
        title="Eliminar chollos seleccionados"
        description={`¿Estás seguro de eliminar ${selectedIds.size} chollos? Esta acción no se puede deshacer.`}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Todos los chollos</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>{totalFiltered} chollos ({filteredDeals.filter(d => d.status === 'draft').length} borradores)</p>
        </div>
        <Link href="/admin/deals/new">
          <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo chollo
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl p-4 mb-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4A6080' }} />
              <Input
                placeholder="Buscar por título, EAN o descripción..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10 rounded-xl"
                style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
              />
          </div>
          
          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F' }}>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={storeFilter} onValueChange={handleStoreFilterChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
              <SelectValue placeholder="Tienda" />
            </SelectTrigger>
            <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F' }}>
              <SelectItem value="all">Todas las tiendas</SelectItem>
              {uniqueStores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F' }}>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="featured">Destacados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalFiltered === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#1A2535' }}>
            <ShoppingBag className="h-7 w-7" style={{ color: '#00D4FF' }} />
          </div>
          <h2 className="font-bold text-lg mb-1" style={{ color: '#E8F0FE' }}>No hay chollos aún</h2>
          <p className="text-sm mb-6" style={{ color: '#8BA3C7' }}>Añade el primer chollo para empezar a publicar ofertas.</p>
          <Link href="/admin/deals/new">
            <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear primer chollo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: '#1A2535', borderBottom: '1px solid #1E3A5F' }}>
              <span className="text-sm font-medium" style={{ color: '#8BA3C7' }}>
                {selectedIds.size} seleccionados
              </span>
              <div className="flex items-center gap-1.5 ml-3">
                <Button size="sm" onClick={() => handleBulkAction('publish')} disabled={bulkLoading} className="h-8 px-3 rounded-lg text-xs font-semibold" style={{ background: 'rgba(38,222,129,0.15)', color: '#26DE81', border: '1px solid rgba(38,222,129,0.3)' }}>
                  {bulkAction === 'publish' ? '...' : <><Check className="h-3 w-3 mr-1" />Publicar</>}
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('draft')} disabled={bulkLoading} className="h-8 px-3 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}>
                  {bulkAction === 'draft' ? '...' : 'Borrador'}
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('delete')} disabled={bulkLoading} className="h-8 px-3 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {bulkAction === 'delete' ? '...' : <><X className="h-3 w-3 mr-1" />Eliminar</>}
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E3A5F', background: '#1A2535' }}>
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) {
                          setSelectedIds(new Set())
                        } else {
                          setSelectedIds(new Set(pagedDeals.map(d => d.id)))
                        }
                      }}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: '#00D4FF' }}
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Producto</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Cat.</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Tienda</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Precio</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Dto.</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Estado</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Stock</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Fecha</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}></th>
                </tr>
              </thead>
              <tbody>
                {pagedDeals.map((deal) => (
                  <tr key={deal.id} style={{ borderBottom: '1px solid #1E3A5F' }}>
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(deal.id)}
                        onChange={() => {
                          setSelectedIds(prev => {
                            const next = new Set(prev)
                            if (next.has(deal.id)) next.delete(deal.id)
                            else next.add(deal.id)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: '#00D4FF' }}
                      />
                    </td>
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
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(deal.id, deal.status || 'draft')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all duration-200 hover:opacity-80"
                        style={{
                          background: deal.status === 'published' ? 'rgba(38,222,129,0.15)' : 'rgba(255,184,0,0.15)',
                          color: deal.status === 'published' ? '#26DE81' : '#FFB800',
                          border: deal.status === 'published' ? '1px solid rgba(38,222,129,0.3)' : '1px solid rgba(255,184,0,0.3)',
                        }}
                        aria-label={deal.status === 'published' ? 'Despublicar chollo' : 'Publicar chollo'}
                      >
                        <span className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: deal.status === 'published' ? '#26DE81' : '#FFB800',
                            boxShadow: deal.status === 'published' ? '0 0 6px rgba(38,222,129,0.5)' : '0 0 6px rgba(255,184,0,0.5)',
                          }}
                        />
                        {deal.status === 'published' ? 'Publicado' : 'Borrador'}
                      </button>
                      {deal.expiresAt && new Date(deal.expiresAt) < new Date() && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.12)' }}>
                          EXPIRADO
                        </span>
                      )}
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
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/deals/${deal.slug}`} target="_blank">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }} aria-label="Ver en web">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver en web</TooltipContent>
                          </Tooltip>
                        </Link>
                        <Link href={`/admin/deals/${deal.id}/edit`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }} aria-label="Editar chollo">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar chollo</TooltipContent>
                          </Tooltip>
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                              style={{ color: '#4A6080' }}
                              onClick={() => setDeleteTarget({ id: deal.id, title: deal.title })}
                              aria-label="Eliminar chollo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar chollo</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalItems={totalFiltered} pageSize={PAGE_SIZE} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  )
}
