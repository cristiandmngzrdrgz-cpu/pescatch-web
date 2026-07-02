'use client'

import { useState } from 'react'
import { Fish, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdminLogin() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || loading) return

    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: value.trim() }),
      })

      if (!res.ok) {
        setError(true)
        setLoading(false)
        return
      }

      window.location.reload()
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0B1120' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: '#1A2535' }}>
          <Lock className="h-7 w-7" style={{ color: '#00D4FF' }} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Fish className="h-5 w-5" style={{ color: '#00D4FF' }} />
          <span className="font-extrabold text-lg" style={{ color: '#E8F0FE' }}>PesCatch Admin</span>
        </div>
        <Input
          type="password"
          placeholder="Admin secret"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false) }}
          className="h-11 rounded-xl mb-2 text-center"
          style={{ background: '#0B1120', borderColor: error ? '#EF4444' : '#1E3A5F', color: '#E8F0FE' }}
        />
        {error && (
          <p className="text-sm mb-3" style={{ color: '#EF4444' }}>Contraseña incorrecta</p>
        )}
        <Button type="submit" disabled={loading} className="w-full h-11 font-semibold rounded-xl mt-2" style={{ background: '#00D4FF', color: '#0B1120' }}>
          {loading ? 'Comprobando...' : 'Acceder'}
        </Button>
      </form>
    </div>
  )
}
