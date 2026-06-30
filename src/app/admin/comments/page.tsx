'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CommentRow {
  id: number
  dealId: string
  author: string
  content: string
  createdAt: string
  dealTitle: string
  dealSlug: string
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => {
    fetch('/api/comments')
      .then(r => r.json())
      .then((data: CommentRow[]) => setComments(data))
      .finally(() => setLoading(false))
  }, [fetchKey])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#00D4FF' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Comentarios</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>{comments.length} comentarios en total</p>
        </div>
        <Button variant="outline" onClick={() => setFetchKey(k => k + 1)} className="h-10 px-4 rounded-xl text-xs" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
          Recargar
        </Button>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#1A2535' }}>
            <MessageSquare className="h-7 w-7" style={{ color: '#00D4FF' }} />
          </div>
          <h2 className="font-bold text-lg mb-1" style={{ color: '#E8F0FE' }}>No hay comentarios</h2>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>Los comentarios de los usuarios aparecerán aquí cuando empiecen a participar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: '#E8F0FE' }}>{comment.author}</span>
                    <span className="text-xs" style={{ color: '#4A6080' }}>{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: '#8BA3C7' }}>{comment.content}</p>
                  {comment.dealTitle && (
                    <Link
                      href={`/deals/${comment.dealSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: '#00D4FF' }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      En: {comment.dealTitle}
                    </Link>
                  )}
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="h-8 w-8 p-0 rounded-lg flex-shrink-0"
                  style={{ color: '#EF4444' }}
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                >
                  {deleting === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
