'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Save, Pencil, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const id = params.id as string

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '',
    featuredImage: '', category: '', author: 'PesCatch',
    tags: '', relatedAsins: '', publishedAt: '',
  })

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        const data = await r.json()
        setForm({
          title: data.title, slug: data.slug, excerpt: data.excerpt || '',
          content: data.content || '', featuredImage: data.featuredImage || '',
          category: data.category || '', author: data.author || 'PesCatch',
          tags: (data.tags || []).join(', '),
          relatedAsins: (data.relatedAsins || []).join(', '),
          publishedAt: data.publishedAt?.slice(0, 10) || '',
        })
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const relatedAsins = form.relatedAsins.split(',').map(t => t.trim()).filter(Boolean)

    const body = {
      title: form.title, slug: form.slug, excerpt: form.excerpt,
      content: form.content, featuredImage: form.featuredImage,
      category: form.category, author: form.author || 'PesCatch',
      tags, relatedAsins,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      router.push('/admin/blog')
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#00D4FF' }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#1A2535' }}>
          <Pencil className="h-8 w-8" style={{ color: '#00D4FF' }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#E8F0FE' }}>Artículo no encontrado</h1>
        <Link href="/admin/blog" className="font-semibold hover:underline" style={{ color: '#00D4FF' }}>Volver al blog</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" style={{ border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Editar artículo</h1>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>{form.title}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/blog/${form.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl text-xs" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Ver en web
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Información básica</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Título</label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Slug</label>
            <Input value={form.slug} onChange={e => updateField('slug', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Extracto</label>
            <Textarea value={form.excerpt} onChange={e => updateField('excerpt', e.target.value)} rows={2} className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Contenido</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Categoría</label>
            <Input value={form.category} onChange={e => updateField('category', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Contenido (Markdown)</label>
            <Textarea value={form.content} onChange={e => updateField('content', e.target.value)} rows={16} className="rounded-xl font-mono text-sm leading-relaxed resize-y" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Metadatos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Imagen destacada (URL)</label>
              <Input value={form.featuredImage} onChange={e => updateField('featuredImage', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Autor</label>
              <Input value={form.author} onChange={e => updateField('author', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Tags (separados por coma)</label>
              <Input value={form.tags} onChange={e => updateField('tags', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>ASINs relacionados</label>
              <Input value={form.relatedAsins} onChange={e => updateField('relatedAsins', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Fecha publicación</label>
              <Input type="date" value={form.publishedAt} onChange={e => updateField('publishedAt', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Link href="/admin/blog">
            <Button type="button" variant="outline" className="h-11 px-6 rounded-xl" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
