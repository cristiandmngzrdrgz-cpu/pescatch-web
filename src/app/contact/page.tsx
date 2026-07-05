'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim() || !form.message.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        const data = await res.json()
        setError(data.error || 'Error al enviar')
        setStatus('error')
      }
    } catch {
      setError('Error de conexión')
      setStatus('error')
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(30,58,95,0.5)',
    color: '#E8F0FE',
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Contacto</h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7' }}>
        ¿Tienes alguna pregunta, sugerencia o has encontrado un error? Escríbenos.
      </p>

      <div className="space-y-6">
        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Formulario de contacto</h2>
          {status === 'success' ? (
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(38,222,129,0.1)', border: '1px solid rgba(38,222,129,0.2)' }}>
              <p className="font-semibold" style={{ color: '#26DE81' }}>Mensaje enviado correctamente. Te responderemos pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8BA3C7' }}>Nombre (opcional)</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full h-11 text-sm rounded-xl"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8BA3C7' }}>Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full h-11 text-sm rounded-xl"
                  style={status === 'error' ? { ...inputStyle, border: '1px solid rgba(239,68,68,0.5)' } : inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8BA3C7' }}>Mensaje *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={5}
                  className="w-full rounded-xl text-sm p-3 transition-all duration-200 resize-none"
                  style={{ ...inputStyle, minHeight: '120px' }}
                  required
                />
              </div>
              {status === 'error' && (
                <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
              )}
              <Button type="submit" disabled={status === 'loading'} className="h-11 px-6 font-semibold rounded-xl transition-all duration-200 glow-cta"
                style={{ background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}>
                {status === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </form>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Email directo</h2>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>
            Para consultas generales:{' '}
            <a href="mailto:contacto@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              contacto@pescatch.es
            </a>
          </p>
          <p className="text-sm mt-2" style={{ color: '#8BA3C7' }}>
            Para reportar un error en un deal:{' '}
            <a href="mailto:errores@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              errores@pescatch.es
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
