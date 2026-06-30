'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, STORES } from '@/types'
import type { Deal } from '@/types'
import { ChevronLeft, Save, Pencil, Loader2 } from 'lucide-react'
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
  })

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
        })
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const updateField = (key: string, value: string | null) => {
    if (value === null) return
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const store = STORES.find(s => s.id === form.store)

    const body = {
      title: form.title, slug: form.slug, description: form.description,
      originalPrice: parseFloat(form.originalPrice), salePrice: parseFloat(form.salePrice),
      shippingCost: parseFloat(form.shippingCost), imageUrl: form.imageUrl,
      images: form.imageUrl ? [form.imageUrl] : [],
      storeId: store?.id || '', storeName: store?.name || '',
      storeUrl: store?.url || '', storeReputation: store?.reputation || 'good',
      storeCommissionRate: store?.commissionRate || 0,
      affiliateUrl: form.affiliateUrl, category: form.category,
      subcategory: form.subcategory || '', tags: [], stockStatus: form.stockStatus,
      rating: originalDeal?.rating ?? 0,
      reviewCount: originalDeal?.reviewCount ?? 0,
      technicalSpecs: originalDeal?.technicalSpecs ?? {},
      review: form.review,
      pros: originalDeal?.pros ?? [],
      cons: originalDeal?.cons ?? [],
      featured: originalDeal?.featured ?? false,
      commission: originalDeal?.commission ?? 0,
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
