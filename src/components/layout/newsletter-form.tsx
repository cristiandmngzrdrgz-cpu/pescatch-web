'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  if (subscribed) {
    return <p className="text-sm font-semibold" style={{ color: '#26DE81' }}>Gracias! Te has suscrito.</p>
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true) }} className="flex gap-2 max-w-sm">
      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 h-10 text-sm rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(30,58,95,0.5)',
          color: '#E8F0FE',
        }} />
      <Button type="submit" className="h-10 px-5 font-semibold rounded-xl transition-all duration-200 glow-cta"
        style={{ background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}>
        Suscribir
      </Button>
    </form>
  )
}
