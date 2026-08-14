'use client'

import { useState, useSyncExternalStore } from 'react'
import { Bell } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'

interface PriceAlertButtonProps {
  dealId: string
  dealSlug: string
  currentPrice: number
  alertCancelled?: boolean
}

const EMAIL_KEY = 'pescatch_alert_email'

function subscribeEmail(cb: () => void): () => void {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

function getEmailSnapshot(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

export function PriceAlertButton({ dealId, currentPrice, alertCancelled = false }: PriceAlertButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [cancelled, setCancelled] = useState(alertCancelled)
  const storedEmail = useSyncExternalStore(subscribeEmail, getEmailSnapshot, () => '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          dealId,
          targetPrice: targetPrice ? Number(targetPrice) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem(EMAIL_KEY, email.trim())
        setStatus('success')
        setMessage('')
        setCancelled(false)
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al activar la alerta')
      }
    } catch {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-11 rounded-xl"
        style={{
          borderColor: cancelled ? '#26DE81' : 'rgba(0,212,255,0.4)',
          color: cancelled ? '#26DE81' : '#00D4FF',
          background: cancelled ? 'rgba(38,222,129,0.08)' : 'rgba(0,212,255,0.06)',
        }}
        onClick={() => {
          if (!email && storedEmail) setEmail(storedEmail)
          setOpen(true)
        }}
      >
        <Bell className="h-4 w-4 mr-1.5" />
        {cancelled ? 'Alerta reactivable' : 'Avísame si baja de precio'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#E8F0FE' }}>🔔 Alerta de precio</DialogTitle>
            <DialogDescription style={{ color: '#8BA3C7' }}>
              Te avisaremos por email cuando el precio baje de tu objetivo. Precio actual:{' '}
              <span style={{ color: '#FFB800', fontWeight: 700 }}>{formatPrice(currentPrice)}</span>
            </DialogDescription>
          </DialogHeader>

          {status === 'success' ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#26DE81' }}>
                ¡Alerta activada! Te avisaremos si baja de precio.
              </p>
              <Button variant="outline" className="w-full rounded-xl" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }} onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#4A6080' }}>
                  Tu email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email || (open && storedEmail ? storedEmail : '')}
                  onChange={e => setEmail(e.target.value)}
                  className="h-10 text-sm rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: status === 'error' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(30,58,95,0.5)',
                    color: '#E8F0FE',
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#4A6080' }}>
                  Precio objetivo (opcional)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={formatPrice(currentPrice)}
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  className="h-10 text-sm rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(30,58,95,0.5)',
                    color: '#E8F0FE',
                  }}
                />
                <p className="text-[0.7rem]" style={{ color: '#4A6080' }}>
                  Si lo dejas vacío, te avisamos con cualquier bajada.
                </p>
              </div>
              {status === 'error' && (
                <p className="text-xs" style={{ color: '#EF4444' }}>{message}</p>
              )}
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-10 font-semibold rounded-xl glow-cta"
                style={{ background: '#00D4FF', color: '#0B1120', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}
              >
                {status === 'loading' ? 'Activando...' : 'Activar alerta'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
