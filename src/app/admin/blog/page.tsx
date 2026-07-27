'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { BlogPost } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Newspaper, Search, ExternalLink, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import Pagination from '@/components/admin/Pagination'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const PAGE_SIZE = 20

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/posts?includeHidden=true')
      .then(r => r.json())
      .then((data: BlogPost[]) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'draft' && post.status === 'draft') ||
                         (statusFilter === 'published' && post.status === 'published')
    return matchesSearch && matchesStatus
  })

  const totalFiltered = filteredPosts.length
  const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allSelected = pagedPosts.length > 0 && pagedPosts.every(p => selectedIds.has(p.id))

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/posts/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.title}" eliminado`)
    } else {
      toast.error('Error al eliminar')
    }
  }, [deleteTarget])

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      toast.success(newStatus === 'published' ? 'Artículo publicado' : 'Artículo en borrador')
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
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        if (action === 'delete') {
          setPosts(prev => prev.filter(p => !selectedIds.has(p.id)))
        } else if (action === 'publish') {
          setPosts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, status: 'published', hidden: false } : p))
        } else if (action === 'draft') {
          setPosts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, status: 'draft', hidden: true } : p))
        }
        toast.success(`${selectedIds.size} artículos actualizados`)
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
        title="Eliminar artículo"
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
            const res = await fetch('/api/posts/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
            })
            if (res.ok) {
              setPosts(prev => prev.filter(p => !selectedIds.has(p.id)))
              toast.success(`${selectedIds.size} artículos eliminados`)
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
        title="Eliminar artículos seleccionados"
        description={`¿Estás seguro de eliminar ${selectedIds.size} artículos? Esta acción no se puede deshacer.`}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Todos los posts</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>{totalFiltered} artículos ({filteredPosts.filter(p => p.status === 'draft').length} borradores)</p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo post
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl p-4 mb-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4A6080' }} />
              <Input
                placeholder="Buscar por título, slug o contenido..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10 rounded-xl"
                style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
              />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F' }}>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalFiltered === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#1A2535' }}>
            <Newspaper className="h-7 w-7" style={{ color: '#00D4FF' }} />
          </div>
          <h2 className="font-bold text-lg mb-1" style={{ color: '#E8F0FE' }}>No hay artículos aún</h2>
          <p className="text-sm mb-6" style={{ color: '#8BA3C7' }}>Publica tu primer post de blog para empezar a atraer tráfico orgánico.</p>
          <Link href="/admin/blog/new">
            <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear primer post
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
                  <Check className="h-3 w-3 mr-1" />Publicar
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('draft')} disabled={bulkLoading} className="h-8 px-3 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}>
                  Borrador
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
                        if (allSelected) setSelectedIds(new Set())
                        else setSelectedIds(new Set(pagedPosts.map(p => p.id)))
                      }}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: '#00D4FF' }}
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Título</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Categoría</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Estado</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Fecha</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}></th>
                </tr>
              </thead>
              <tbody>
                {pagedPosts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: '1px solid #1E3A5F' }}>
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(post.id)}
                        onChange={() => {
                          setSelectedIds(prev => {
                            const next = new Set(prev)
                            if (next.has(post.id)) next.delete(post.id)
                            else next.add(post.id)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: '#00D4FF' }}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                          {post.featuredImage ? (
                            <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Newspaper className="h-4 w-4" style={{ color: '#00D4FF' }} />
                          )}
                        </div>
                        <div className="font-semibold max-w-[280px] truncate" style={{ color: '#E8F0FE' }}>
                          {post.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#8BA3C7' }}>{post.category || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(post.id, post.status || 'draft')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all duration-200 hover:opacity-80"
                        style={{
                          background: post.status === 'published' ? 'rgba(38,222,129,0.15)' : 'rgba(255,184,0,0.15)',
                          color: post.status === 'published' ? '#26DE81' : '#FFB800',
                          border: post.status === 'published' ? '1px solid rgba(38,222,129,0.3)' : '1px solid rgba(255,184,0,0.3)',
                        }}
                        aria-label={post.status === 'published' ? 'Despublicar artículo' : 'Publicar artículo'}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{
                          background: post.status === 'published' ? '#26DE81' : '#FFB800',
                          boxShadow: post.status === 'published' ? '0 0 6px rgba(38,222,129,0.5)' : '0 0 6px rgba(255,184,0,0.5)',
                        }} />
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#4A6080' }}>{formatDate(post.publishedAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }} aria-label="Ver en web">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver en web</TooltipContent>
                          </Tooltip>
                        </Link>
                        <Link href={`/admin/blog/${post.id}/edit`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }} aria-label="Editar artículo">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar artículo</TooltipContent>
                          </Tooltip>
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                              style={{ color: '#4A6080' }}
                              onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                              aria-label="Eliminar artículo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar artículo</TooltipContent>
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
