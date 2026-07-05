'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function MetaFieldsForm({ form, updateField }: {
  form: { metaTitle: string; metaDescription: string; canonicalUrl: string; focusKeyword: string }
  updateField: (key: string, value: string) => void
}) {
  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
      <h2 className="font-bold flex items-center gap-2" style={{ color: '#E8F0FE' }}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#00D4FF' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        SEO
      </h2>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Meta Title (opcional)</label>
        <Input
          value={form.metaTitle}
          onChange={e => updateField('metaTitle', e.target.value)}
          placeholder="Ej: Carretes Shimano 2025 — Ofertas en Amazon"
          className="h-11 rounded-xl"
          style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
        />
        <p className="text-xs mt-1" style={{ color: '#8BA3C7' }}>Si se deja vacío, se genera automáticamente desde el título.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Meta Description (opcional)</label>
        <Textarea
          value={form.metaDescription}
          onChange={e => updateField('metaDescription', e.target.value)}
          placeholder="Ej: Descubre los mejores carretes Shimano 2025 con descuentos exclusivos en Amazon. Comparativa de precios y modelos."
          rows={3}
          className="rounded-xl resize-none"
          style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
        />
        <p className="text-xs mt-1" style={{ color: '#8BA3C7' }}>Máx. 160 caracteres. Si se deja vacío, se usa la descripción.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>URL Canónica (opcional)</label>
        <Input
          value={form.canonicalUrl}
          onChange={e => updateField('canonicalUrl', e.target.value)}
          placeholder="Ej: https://pescatch.es/deals/carrete-shimano-2025"
          className="h-11 rounded-xl"
          style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#E8F0FE' }}>Keyword principal (opcional)</label>
        <Input
          value={form.focusKeyword}
          onChange={e => updateField('focusKeyword', e.target.value)}
          placeholder="Ej: carretes shimano 2025"
          className="h-11 rounded-xl"
          style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
        />
      </div>
    </div>
  )
}