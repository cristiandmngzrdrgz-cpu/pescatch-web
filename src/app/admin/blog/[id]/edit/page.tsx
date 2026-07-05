'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { slugify } from '@/lib/utils'
import { ChevronLeft, Save, Pencil, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import ImageUploader from '@/components/admin/ImageUploader'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import ProductSelector from '@/components/admin/ProductSelector'
import type { ProductSelectEntry } from '@/components/admin/ProductSelector'
import { ShoppingBag } from 'lucide-react'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useCtrlSubmit } from '@/hooks/useCtrlSubmit'
import { MetaFieldsForm } from '@/components/admin/MetaFieldsForm'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [showProductSelector, setShowProductSelector] = useState(false)

  const id = params.id as string

  const [form, setForm] = useState({
    title: '', slug: '', slugManuallyEdited: false, excerpt: '', content: '',
    featuredImage: '', category: '', author: 'PesCatch',
    tags: '', relatedAsins: '', publishedAt: '',
    status: 'draft',
    metaTitle: '', metaDescription: '', canonicalUrl: '', focusKeyword: '',
  })
  const formRef = useRef<HTMLFormElement>(null)

  const draftData = form
  const { checkAndRestore } = useAutoSave('admin-draft-post-' + id, draftData)
  useCtrlSubmit(() => formRef.current?.requestSubmit(), saving)

  useEffect(() => {
    if (loading) return
    checkAndRestore((draft) => {
      const f = draft as typeof form
      setForm(prev => ({ ...prev, ...f, slugManuallyEdited: true }))
    })
  }, [checkAndRestore, loading])

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        const data = await r.json()
        setForm({
          title: data.title, slug: data.slug, slugManuallyEdited: true, excerpt: data.excerpt || '',
          content: data.content || '', featuredImage: data.featuredImage || '',
          category: data.category || '', author: data.author || 'PesCatch',
          tags: (data.tags || []).join(', '),
          relatedAsins: (data.relatedAsins || []).join(', '),
          publishedAt: data.publishedAt?.slice(0, 10) || '',
          status: data.status || 'draft',
          metaTitle: data.metaTitle || '', metaDescription: data.metaDescription || '',
          canonicalUrl: data.canonicalUrl || '', focusKeyword: data.focusKeyword || '',
        })
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const updateField = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !prev.slugManuallyEdited) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const regenerateSlug = () => {
    setForm(prev => ({ ...prev, slug: slugify(prev.title) }))
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
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
      metaTitle: form.metaTitle, metaDescription: form.metaDescription,
      canonicalUrl: form.canonicalUrl, focusKeyword: form.focusKeyword,
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const detail = Array.isArray(err.issues) && err.issues.length > 0
          ? err.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join(' · ')
          : err.error
        throw new Error(detail || 'Error al actualizar')
      }
      localStorage.removeItem('admin-draft-post-' + id)
      toast.success('Artículo actualizado correctamente')
      router.push('/admin/blog')
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleInsertProducts = (entries: ProductSelectEntry[]) => {
    const json = JSON.stringify(entries, null, 2)
    const comment = `<!-- PRODUCTS_DATA: ${json} -->`
    const current = form.content
    const regex = /<!--\s*PRODUCTS_DATA:\s*\[[\s\S]*?\]\s*-->/g

    if (regex.test(current)) {
      updateField('content', current.replace(regex, comment))
    } else {
      updateField('content', comment + '\n\n' + current)
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" style={{ border: '1px solid #1E3A5F', color: '#8BA3C7' }} aria-label="Volver a la lista">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Volver a la lista</TooltipContent>
          </Tooltip>
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

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Información básica</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Título</label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Slug</label>
            <div className="flex gap-2">
              <Input value={form.slug} onChange={e => { updateField('slug', e.target.value); setForm(prev => ({ ...prev, slugManuallyEdited: true })) }} required className="h-11 rounded-xl flex-1" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" onClick={regenerateSlug} className="h-11 px-3 rounded-xl flex-shrink-0" style={{ background: '#1A2535', color: '#00D4FF', border: '1px solid #1E3A5F' }} aria-label="Regenerar slug">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerar slug desde el título</TooltipContent>
              </Tooltip>
            </div>
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
            <div className="flex items-center gap-2 mb-2">
              <Button type="button" onClick={() => setShowProductSelector(true)} className="h-8 px-3 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                Insertar productos
              </Button>
              <span className="text-xs" style={{ color: '#4A6080' }}>Inserta cards de chollos en el artículo</span>
            </div>
            <MarkdownEditor value={form.content} onChange={v => updateField('content', v || '')} height={400} />
          </div>
        </div>

        <ProductSelector
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onConfirm={handleInsertProducts}
        />

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Metadatos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <ImageUploader value={form.featuredImage} onChange={v => updateField('featuredImage', v)} label="Imagen destacada" />
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

        <MetaFieldsForm
          form={{ metaTitle: form.metaTitle, metaDescription: form.metaDescription, canonicalUrl: form.canonicalUrl, focusKeyword: form.focusKeyword }}
          updateField={updateField}
        />

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Visibilidad</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, status: 'draft' }))}
              className="flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border"
              style={{
                background: form.status === 'draft' ? 'rgba(255,184,0,0.1)' : '#0B1120',
                borderColor: form.status === 'draft' ? 'rgba(255,184,0,0.3)' : '#1E3A5F',
                color: '#E8F0FE',
              }}
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: form.status === 'draft' ? 'rgba(255,184,0,0.2)' : '#1A2535' }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FFB800', boxShadow: form.status === 'draft' ? '0 0 8px rgba(255,184,0,0.5)' : 'none' }} />
              </div>
              <div className="text-left">
                <span className="font-semibold text-sm">Borrador</span>
                <p className="text-xs mt-0.5" style={{ color: '#8BA3C7' }}>Guardado pero no visible en la web.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, status: 'published' }))}
              className="flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border"
              style={{
                background: form.status === 'published' ? 'rgba(38,222,129,0.1)' : '#0B1120',
                borderColor: form.status === 'published' ? 'rgba(38,222,129,0.3)' : '#1E3A5F',
                color: '#E8F0FE',
              }}
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: form.status === 'published' ? 'rgba(38,222,129,0.2)' : '#1A2535' }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#26DE81', boxShadow: form.status === 'published' ? '0 0 8px rgba(38,222,129,0.5)' : 'none' }} />
              </div>
              <div className="text-left">
                <span className="font-semibold text-sm">Publicado</span>
                <p className="text-xs mt-0.5" style={{ color: '#8BA3C7' }}>Visible para todos en la web.</p>
              </div>
            </button>
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
            {saving ? 'Guardando...' : form.status === 'draft' ? 'Guardar borrador' : 'Guardar y publicar'}
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
