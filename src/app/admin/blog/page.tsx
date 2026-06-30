'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Newspaper } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then((data: BlogPost[]) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== id))
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Todos los posts</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>{posts.length} artículos publicados</p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="h-10 px-5 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E3A5F', background: '#1A2535' }}>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Título</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Categoría</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Slug</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}>Publicado</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#8BA3C7' }}></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: '1px solid #1E3A5F' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                          {post.featuredImage ? (
                            <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Newspaper className="h-4 w-4" style={{ color: '#00D4FF' }} />
                          )}
                        </div>
                        <div className="font-semibold max-w-[280px] truncate" style={{ color: '#E8F0FE' }}>{post.title}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#8BA3C7' }}>{post.category || '—'}</td>
                    <td className="px-5 py-3.5" style={{ color: '#4A6080' }}>{post.slug}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#4A6080' }}>{formatDate(post.publishedAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/blog/${post.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: '#4A6080' }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                          style={{ color: '#4A6080' }}
                          onClick={() => handleDelete(post.id, post.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
