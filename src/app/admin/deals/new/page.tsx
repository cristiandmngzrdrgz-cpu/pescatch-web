'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, STORES } from '@/types'
import { slugify } from '@/lib/utils'
import { ChevronLeft, Save, Plus, X, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import ImageUploader from '@/components/admin/ImageUploader'
import { MetaFieldsForm } from '@/components/admin/MetaFieldsForm'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useCtrlSubmit } from '@/hooks/useCtrlSubmit'

export default function NewDealPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    slugManuallyEdited: false,
    description: '',
    originalPrice: '',
    salePrice: '',
    shippingCost: '0',
    imageUrl: '',
    category: '',
    subcategory: '',
    store: '',
    affiliateUrl: '',
    stockStatus: 'in_stock',
    stockCount: '',
    review: '',
    status: 'draft',
    featured: false,
    ean: '',
    asin: '',
    brand: '',
    commission: '',
    expiresAt: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    focusKeyword: '',
  })

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [pros, setPros] = useState<string[]>([])
  const [proInput, setProInput] = useState('')
  const [cons, setCons] = useState<string[]>([])
  const [conInput, setConInput] = useState('')
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const draftData = { ...form, tags, pros, cons, specs }
  const { checkAndRestore } = useAutoSave('admin-draft-deal-new', draftData)
  useCtrlSubmit(() => formRef.current?.requestSubmit(), saving)

  useEffect(() => {
    checkAndRestore((draft) => {
      const { tags: t, pros: p, cons: c, specs: sp, ...f } = draft as typeof draftData
      setForm(prev => ({ ...prev, ...f, slugManuallyEdited: true }))
      if (Array.isArray(t)) setTags(t)
      if (Array.isArray(p)) setPros(p)
      if (Array.isArray(c)) setCons(c)
      if (Array.isArray(sp)) setSpecs(sp)
    })
  }, [checkAndRestore])

  const updateField = (key: string, value: string | null) => {
    if (value === null) return
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

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const addPro = () => {
    const v = proInput.trim()
    if (v) { setPros(prev => [...prev, v]); setProInput('') }
  }

  const removePro = (idx: number) => {
    setPros(prev => prev.filter((_, i) => i !== idx))
  }

  const addCon = () => {
    const v = conInput.trim()
    if (v) { setCons(prev => [...prev, v]); setConInput('') }
  }

  const removeCon = (idx: number) => {
    setCons(prev => prev.filter((_, i) => i !== idx))
  }

  const addSpec = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }])
  }

  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const removeSpec = (idx: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const store = STORES.find(s => s.id === form.store)

    const specsRecord: Record<string, string> = {}
    specs.forEach(s => { if (s.key.trim()) specsRecord[s.key.trim()] = s.value })

    const body = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      originalPrice: parseFloat(form.originalPrice),
      salePrice: parseFloat(form.salePrice),
      shippingCost: parseFloat(form.shippingCost),
      imageUrl: form.imageUrl,
      images: form.imageUrl ? [form.imageUrl] : [],
      storeId: store?.id || '',
      storeName: store?.name || '',
      storeUrl: store?.url || '',
      storeReputation: store?.reputation || 'good',
      storeCommissionRate: store?.commissionRate || 0,
      affiliateUrl: form.affiliateUrl,
      category: form.category,
      subcategory: form.subcategory || '',
      tags,
      stockStatus: form.stockStatus,
      stockCount: parseInt(form.stockCount) || 0,
      rating: 0,
      reviewCount: 0,
      technicalSpecs: specsRecord,
      review: form.review,
      pros,
      cons,
      featured: form.featured,
      status: form.status,
      commission: parseFloat(form.commission) || 0,
      ean: form.ean,
      asin: form.asin,
      brand: form.brand,
      expiresAt: form.expiresAt || null,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      canonicalUrl: form.canonicalUrl,
      focusKeyword: form.focusKeyword,
    }

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const detail = Array.isArray(err.issues) && err.issues.length > 0
          ? err.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join(' · ')
          : err.error
        throw new Error(detail || 'Error al crear el chollo')
      }
      localStorage.removeItem('admin-draft-deal-new')
      router.push('/admin/deals')
    } catch (err) {
      setError((err as Error).message || 'Error al crear el chollo')
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.id === form.category)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/deals">
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
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Nuevo chollo</h1>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>Publica una nueva oferta de pesca verificada</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: '#E8F0FE' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1A2535' }}>
              <Plus className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
            </div>
            Información básica
          </h2>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Título del producto</label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Ej: Carrete Shimano Stradic FL 2500" required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Slug (URL)</label>
            <div className="flex gap-2">
              <Input value={form.slug} onChange={e => { updateField('slug', e.target.value); setForm(prev => ({ ...prev, slugManuallyEdited: true })) }} placeholder="carrete-shimano-stradic-fl" required className="h-11 rounded-xl flex-1" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
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
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Descripción corta</label>
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={2} placeholder="Descripción breve del producto..." className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Precio y stock</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Precio original (€)</label>
              <Input type="number" step="0.01" min="0" value={form.originalPrice} onChange={e => updateField('originalPrice', e.target.value)} placeholder="249.99" required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Precio oferta (€)</label>
              <Input type="number" step="0.01" min="0" value={form.salePrice} onChange={e => updateField('salePrice', e.target.value)} placeholder="179.99" required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Gastos de envío (€)</label>
              <Input type="number" step="0.01" min="0" value={form.shippingCost} onChange={e => updateField('shippingCost', e.target.value)} placeholder="0" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Estado stock</label>
              <Select value={form.stockStatus} onValueChange={v => updateField('stockStatus', v)}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="limited">Stock limitado</SelectItem>
                  <SelectItem value="out_of_stock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Cantidad en stock</label>
              <Input type="number" min="0" value={form.stockCount} onChange={e => updateField('stockCount', e.target.value)} placeholder="0" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Categoría y tienda</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Categoría</label>
              <Select value={form.category} onValueChange={v => updateField('category', v)}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Subcategoría</label>
              <Select value={form.subcategory} onValueChange={v => updateField('subcategory', v)} disabled={!selectedCategory}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectValue placeholder={selectedCategory ? 'Seleccionar...' : 'Elige categoría primero'} />
                </SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  {selectedCategory?.subcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.slug}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Tienda</label>
              <Select value={form.store} onValueChange={v => updateField('store', v)}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  {STORES.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Tags</h2>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Añadir tag y pulsar Enter..."
              className="h-11 rounded-xl flex-1"
              style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" onClick={addTag} className="h-11 px-4 rounded-xl" style={{ background: '#1A2535', color: '#00D4FF', border: '1px solid #1E3A5F' }} aria-label="Añadir tag">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Añadir tag</TooltipContent>
            </Tooltip>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#1A2535', color: '#00D4FF' }}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Pros y contras</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold" style={{ color: '#26DE81' }}>Puntos fuertes</label>
              <div className="flex gap-2">
                <Input
                  value={proInput}
                  onChange={e => setProInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPro() } }}
                  placeholder="Ej: Excelente relación calidad-precio..."
                  className="h-10 rounded-xl flex-1"
                  style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" onClick={addPro} className="h-10 px-3 rounded-xl" style={{ background: '#1A2535', color: '#26DE81', border: '1px solid #1E3A5F' }} aria-label="Añadir punto fuerte">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Añadir punto fuerte</TooltipContent>
                </Tooltip>
              </div>
              {pros.length > 0 && (
                <ul className="space-y-1.5">
                  {pros.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(38,222,129,0.08)', color: '#26DE81' }}>
                      <span>{p}</span>
                      <button type="button" onClick={() => removePro(i)} className="hover:opacity-70 flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold" style={{ color: '#EF4444' }}>Puntos débiles</label>
              <div className="flex gap-2">
                <Input
                  value={conInput}
                  onChange={e => setConInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCon() } }}
                  placeholder="Ej: Precio elevado..."
                  className="h-10 rounded-xl flex-1"
                  style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" onClick={addCon} className="h-10 px-3 rounded-xl" style={{ background: '#1A2535', color: '#EF4444', border: '1px solid #1E3A5F' }} aria-label="Añadir punto débil">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Añadir punto débil</TooltipContent>
                </Tooltip>
              </div>
              {cons.length > 0 && (
                <ul className="space-y-1.5">
                  {cons.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                      <span>{c}</span>
                      <button type="button" onClick={() => removeCon(i)} className="hover:opacity-70 flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Especificaciones técnicas</h2>
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={spec.key}
                onChange={e => updateSpec(i, 'key', e.target.value)}
                placeholder="Nombre (ej: Peso)"
                className="h-10 rounded-xl flex-1"
                style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
              />
              <Input
                value={spec.value}
                onChange={e => updateSpec(i, 'value', e.target.value)}
                placeholder="Valor (ej: 250g)"
                className="h-10 rounded-xl flex-1"
                style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => removeSpec(i)} className="p-2 hover:opacity-70 flex-shrink-0" aria-label="Eliminar especificación">
                    <X className="h-4 w-4" style={{ color: '#EF4444' }} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Eliminar especificación</TooltipContent>
              </Tooltip>
            </div>
          ))}
          <Button type="button" onClick={addSpec} variant="outline" className="h-10 rounded-xl" style={{ borderColor: '#1E3A5F', color: '#00D4FF', borderStyle: 'dashed' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Añadir especificación
          </Button>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Identificadores de producto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>EAN</label>
              <Input value={form.ean} onChange={e => updateField('ean', e.target.value)} placeholder="1234567890123" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>ASIN (Amazon)</label>
              <Input value={form.asin} onChange={e => updateField('asin', e.target.value)} placeholder="B0XXXXXXX" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Marca</label>
              <Input value={form.brand} onChange={e => updateField('brand', e.target.value)} placeholder="Shimano, Daiwa..." className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Comisión (%)</label>
              <Input type="number" step="0.01" min="0" value={form.commission} onChange={e => updateField('commission', e.target.value)} placeholder="5" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Enlaces e imagen</h2>
          <ImageUploader value={form.imageUrl} onChange={v => updateField('imageUrl', v)} />
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>URL de afiliado</label>
            <Input value={form.affiliateUrl} onChange={e => updateField('affiliateUrl', e.target.value)} placeholder="https://amazon.es/dp/ejemplo?tag=pescatch-21" className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Review / Análisis</label>
            <Textarea value={form.review} onChange={e => updateField('review', e.target.value)} rows={4} placeholder="Escribe tu análisis del producto..." className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <MetaFieldsForm
          form={{ metaTitle: form.metaTitle, metaDescription: form.metaDescription, canonicalUrl: form.canonicalUrl, focusKeyword: form.focusKeyword }}
          updateField={updateField}
        />

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Visibilidad</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer" style={{ color: '#E8F0FE' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded"
                style={{ accentColor: '#FFB800' }}
              />
              <div>
                <span className="font-semibold">Destacado</span>
                <p className="text-xs mt-0.5" style={{ color: '#8BA3C7' }}>Aparece destacado en la página principal y listados.</p>
              </div>
            </label>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Fecha de expiración</label>
              <Input type="date" value={form.expiresAt} onChange={e => updateField('expiresAt', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
              <p className="text-xs mt-1" style={{ color: '#8BA3C7' }}>Opcional. Si se indica, la oferta se ocultará automáticamente al pasar esta fecha.</p>
            </div>
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
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm font-medium mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {error}
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Guardando...' : form.status === 'draft' ? 'Guardar borrador' : 'Publicar chollo'}
          </Button>
          <Link href="/admin/deals">
            <Button type="button" variant="outline" className="h-11 px-6 rounded-xl" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
