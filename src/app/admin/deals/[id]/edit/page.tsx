'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, STORES } from '@/types'
import type { Deal } from '@/types'
import { ChevronLeft, Save, Pencil, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function EditDealPage() {
  const router = useRouter()
  const params = useParams()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const id = params.id as string

  const [form, setForm] = useState({
    title: '', slug: '', description: '',
    originalPrice: '', salePrice: '', shippingCost: '0',
    imageUrl: '', category: '', subcategory: '',
    store: '', affiliateUrl: '', stockStatus: 'in_stock', review: '',
    hidden: false, featured: false,
  })

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [pros, setPros] = useState<string[]>([])
  const [proInput, setProInput] = useState('')
  const [cons, setCons] = useState<string[]>([])
  const [conInput, setConInput] = useState('')
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])

  const [originalDeal, setOriginalDeal] = useState<Deal | null>(null)

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        const data: Deal = await r.json()
        setOriginalDeal(data)
        setForm({
          title: data.title, slug: data.slug, description: data.description,
          originalPrice: data.originalPrice.toString(), salePrice: data.salePrice.toString(),
          shippingCost: data.shippingCost.toString(), imageUrl: data.imageUrl || '',
          category: data.category, subcategory: data.subcategory || '',
          store: data.store?.id || '', affiliateUrl: data.affiliateUrl || '',
          stockStatus: data.stockStatus, review: data.review || '',
          hidden: data.hidden || false, featured: data.featured || false,
        })
        setTags(data.tags || [])
        setPros(data.pros || [])
        setCons(data.cons || [])
        if (data.technicalSpecs) {
          setSpecs(Object.entries(data.technicalSpecs).map(([key, value]) => ({ key, value })))
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const updateField = (key: string, value: string | null) => {
    if (value === null) return
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput('') }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const addPro = () => {
    const v = proInput.trim()
    if (v) { setPros(prev => [...prev, v]); setProInput('') }
  }

  const removePro = (idx: number) => setPros(prev => prev.filter((_, i) => i !== idx))

  const addCon = () => {
    const v = conInput.trim()
    if (v) { setCons(prev => [...prev, v]); setConInput('') }
  }

  const removeCon = (idx: number) => setCons(prev => prev.filter((_, i) => i !== idx))

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }])

  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const removeSpec = (idx: number) => setSpecs(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const store = STORES.find(s => s.id === form.store)

    const specsRecord: Record<string, string> = {}
    specs.forEach(s => { if (s.key.trim()) specsRecord[s.key.trim()] = s.value })

    const body = {
      title: form.title, slug: form.slug, description: form.description,
      originalPrice: parseFloat(form.originalPrice), salePrice: parseFloat(form.salePrice),
      shippingCost: parseFloat(form.shippingCost), imageUrl: form.imageUrl,
      images: form.imageUrl ? [form.imageUrl] : [],
      storeId: store?.id || '', storeName: store?.name || '',
      storeUrl: store?.url || '', storeReputation: store?.reputation || 'good',
      storeCommissionRate: store?.commissionRate || 0,
      affiliateUrl: form.affiliateUrl, category: form.category,
      subcategory: form.subcategory || '', tags,
      stockStatus: form.stockStatus,
      rating: originalDeal?.rating ?? 0,
      reviewCount: originalDeal?.reviewCount ?? 0,
      technicalSpecs: specsRecord,
      review: form.review,
      pros, cons,
      featured: form.featured,
      hidden: form.hidden,
      commission: originalDeal?.commission ?? 0,
      ean: originalDeal?.ean ?? '',
      asin: originalDeal?.asin ?? '',
    }

    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      router.push('/admin/deals')
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.id === form.category)

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
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#E8F0FE' }}>Chollo no encontrado</h1>
        <Link href="/admin/deals" className="font-semibold hover:underline" style={{ color: '#00D4FF' }}>Volver a la lista</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/deals">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" style={{ border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Editar chollo</h1>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>Modificando: {originalDeal?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: '#E8F0FE' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1A2535' }}>
              <Pencil className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
            </div>
            Información básica
          </h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Título del producto</label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Slug (URL)</label>
            <Input value={form.slug} onChange={e => updateField('slug', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Descripción corta</label>
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={2} className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Precio y stock</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Precio original (€)</label>
              <Input type="number" step="0.01" min="0" value={form.originalPrice} onChange={e => updateField('originalPrice', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Precio oferta (€)</label>
              <Input type="number" step="0.01" min="0" value={form.salePrice} onChange={e => updateField('salePrice', e.target.value)} required className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Gastos de envío (€)</label>
              <Input type="number" step="0.01" value={form.shippingCost} onChange={e => updateField('shippingCost', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Estado stock</label>
              <Select value={form.stockStatus} onValueChange={v => updateField('stockStatus', v)}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="limited">Stock limitado</SelectItem>
                  <SelectItem value="out_of_stock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Categoría y tienda</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Categoría</label>
              <Select value={form.category} onValueChange={v => updateField('category', v)}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
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
                <SelectTrigger className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}>
                  {STORES.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
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
            <Button type="button" onClick={addTag} className="h-11 px-4 rounded-xl" style={{ background: '#1A2535', color: '#00D4FF', border: '1px solid #1E3A5F' }}>
              <Plus className="h-4 w-4" />
            </Button>
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
                <Button type="button" onClick={addPro} className="h-10 px-3 rounded-xl" style={{ background: '#1A2535', color: '#26DE81', border: '1px solid #1E3A5F' }}>
                  <Plus className="h-4 w-4" />
                </Button>
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
                <Button type="button" onClick={addCon} className="h-10 px-3 rounded-xl" style={{ background: '#1A2535', color: '#EF4444', border: '1px solid #1E3A5F' }}>
                  <Plus className="h-4 w-4" />
                </Button>
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
              <button type="button" onClick={() => removeSpec(i)} className="p-2 hover:opacity-70 flex-shrink-0">
                <X className="h-4 w-4" style={{ color: '#EF4444' }} />
              </button>
            </div>
          ))}
          <Button type="button" onClick={addSpec} variant="outline" className="h-10 rounded-xl" style={{ borderColor: '#1E3A5F', color: '#00D4FF', borderStyle: 'dashed' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Añadir especificación
          </Button>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Enlaces e imagen</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>URL de afiliado</label>
            <Input value={form.affiliateUrl} onChange={e => updateField('affiliateUrl', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>URL de imagen</label>
            <Input value={form.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} className="h-11 rounded-xl" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Review / Análisis</label>
            <Textarea value={form.review} onChange={e => updateField('review', e.target.value)} rows={4} className="rounded-xl resize-none" style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }} />
          </div>
        </div>

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
            <label className="flex items-center gap-3 cursor-pointer" style={{ color: '#E8F0FE' }}>
              <input
                type="checkbox"
                checked={form.hidden}
                onChange={e => setForm(prev => ({ ...prev, hidden: e.target.checked }))}
                className="h-4 w-4 rounded"
                style={{ accentColor: '#EF4444' }}
              />
              <div>
                <span className="font-semibold">Oculto</span>
                <p className="text-xs mt-0.5" style={{ color: '#8BA3C7' }}>No se muestra en la web pública. Visible solo en el panel admin.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold rounded-xl" style={{ background: '#00D4FF', color: '#0B1120' }}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
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
