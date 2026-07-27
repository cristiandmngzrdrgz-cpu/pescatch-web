'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { trackNewsletterSubscribe } from '@/lib/analytics'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (status === 'success') {
    return <p className="text-sm font-semibold" style={{ color: '#26DE81' }}>Gracias! Te has suscrito.</p>
  }

  return (
    <form onSubmit={async (e) => {
      e.preventDefault()
      if (!email.trim()) return
      setStatus('loading')
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage('')
          trackNewsletterSubscribe()
        } else {
          setStatus('error')
          setMessage(data.error || 'Error al suscribir')
        }
      } catch {
        setStatus('error')
        setMessage('Error de conexión')
      }
    }} className="flex gap-2 max-w-sm flex-col">
      <div className="flex gap-2">
      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 h-10 text-sm rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: status === 'error' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(30,58,95,0.5)',
          color: '#E8F0FE',
        }} />
      <Button type="submit" disabled={status === 'loading'} className="h-10 px-5 font-semibold rounded-xl transition-all duration-200 glow-cta"
        style={{ background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}>
        {status === 'loading' ? '...' : 'Suscribir'}
      </Button>
      </div>
      {status === 'error' && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{message}</p>
      )}
    </form>
  )
}
