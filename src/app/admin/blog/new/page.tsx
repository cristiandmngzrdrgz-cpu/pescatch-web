'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Save, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: '',
    author: 'PesCatch',
    tags: '',
    relatedAsins: '',
    publishedAt: new Date().toISOString().slice(0, 10),
  })

  const updateField = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !prev.slug) {
        next.slug = value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const relatedAsins = form.relatedAsins.split(',').map(t => t.trim()).filter(Boolean)

    const body = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      featuredImage: form.featuredImage,
      category: form.category,
      author: form.author || 'PesCatch',
      tags,
      relatedAsins,
      publishedAt: new Date(form.publishedAt).toISOString(),
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear el post')
      }
      router.push('/admin/blog')
    } catch (err) {
      setError((err as Error).message || 'Error al crear el post')
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Nuevo artículo</h1>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>Crea un post de blog para atraer tráfico orgánico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: '#E8F0FE' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1A2535' }}>
              <Plus className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
            </div>
            Información básica
          </h2>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Título del artículo</label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Ej: Mejores Carretes Spinning 2026" required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Slug (URL)</label>
            <Input value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="mejores-carretes-spinning-2026" required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Extracto / Meta description</label>
            <Textarea value={form.excerpt} onChange={e => updateField('excerpt', e.target.value)} rows={2} placeholder="Resumen breve que aparecerá en la lista de posts y en Google..." className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            <p className="text-xs mt-1" style={{ color: '#4A6080' }}>Máximo 160 caracteres recomendado para SEO.</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Contenido</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Categoría</label>
            <Input value={form.category} onChange={e => updateField('category', e.target.value)} placeholder="Ej: carretes, canas, senuelos" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Contenido (Markdown)</label>
            <p className="text-xs mb-2" style={{ color: '#4A6080' }}>Usa <code style={{ color: '#00D4FF' }}>{'<!-- PRODUCTS_DATA: [...] -->'}</code> para insertar cards de producto.</p>
            <Textarea value={form.content} onChange={e => updateField('content', e.target.value)} rows={16} placeholder="Escribe el artículo en markdown..." className="rounded-xl font-mono text-sm leading-relaxed resize-y" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Metadatos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Imagen destacada (URL)</label>
              <Input value={form.featuredImage} onChange={e => updateField('featuredImage', e.target.value)} placeholder="https://..." className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Autor</label>
              <Input value={form.author} onChange={e => updateField('author', e.target.value)} placeholder="PesCatch" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Tags (separados por coma)</label>
              <Input value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="spinning, carretes, shimano" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>ASINs relacionados (separados por coma)</label>
              <Input value={form.relatedAsins} onChange={e => updateField('relatedAsins', e.target.value)} placeholder="B0XXXXX, B0YYYYY" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Fecha de publicación</label>
              <Input type="date" value={form.publishedAt} onChange={e => updateField('publishedAt', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Publicando...' : 'Publicar artículo'}
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
