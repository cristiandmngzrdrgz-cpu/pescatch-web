'use client'

import { useEffect, useRef, useState } from 'react'

type AdFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical'

interface AdBannerProps {
  /** AdSense ad slot ID (data-ad-slot). Si no se pasa, muestra placeholder en dev */
  slot?: string
  /** Formato del banner */
  format?: AdFormat
  /** Clase extra para el wrapper */
  className?: string
  /** Si true, oculta el banner si no hay consent granted */
  requireConsent?: boolean
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function AdBanner({ slot, format = 'auto', className = '', requireConsent = true }: AdBannerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)
  const [consented, setConsented] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('cookie_consent') === 'granted'
  })

  useEffect(() => {
    const read = () => localStorage.getItem('cookie_consent') === 'granted'
    const onUpdate = () => setConsented(read())
    window.addEventListener('cookie_consent_updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('cookie_consent_updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  useEffect(() => {
    if (pushed.current) return
    if (requireConsent && consented !== true) return
    if (!ADSENSE_CLIENT || !slot) return
    if (!ref.current) return

    try {
      const ins = ref.current.querySelector('ins.adsbygoogle')
      if (ins && ins.getAttribute('data-ad-status') !== 'filled') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushed.current = true
      }
    } catch {
      // AdSense puede fallar en dev / sin slot valido
    }
  }, [slot, requireConsent, consented])

  // Re-push cuando cambia el consent a granted (usuario acepta sin reload)
  useEffect(() => {
    if (consented === true && ADSENSE_CLIENT && slot && !pushed.current && ref.current) {
      try {
        const ins = ref.current.querySelector('ins.adsbygoogle')
        if (ins && ins.getAttribute('data-ad-status') !== 'filled') {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          pushed.current = true
        }
      } catch {
        // noop
      }
    }
  }, [consented, slot])

  // Sin client o sin slot: placeholder visual (no cuenta para AdSense, solo layout/CLS)
  if (!ADSENSE_CLIENT || !slot) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed text-xs ${className}`}
        style={{ background: '#111827', borderColor: '#1E3A5F', color: '#8BA3C7', minHeight: format === 'horizontal' ? 90 : 250 }}
      >
        <span className="px-4 py-6 text-center">
          Espacio publicitario {slot ? `· slot ${slot}` : '· configura NEXT_PUBLIC_ADSENSE_CLIENT y slot'}
        </span>
      </div>
    )
  }

  // Esperando a leer consent (hidratacion) -> skeleton para evitar CLS
  if (consented === null) {
    return (
      <div
        className={`rounded-xl ${className}`}
        style={{ background: '#111827', border: '1px solid #1E3A5F', minHeight: format === 'horizontal' ? 90 : 250 }}
      />
    )
  }

  if (requireConsent && consented !== true) {
    return null
  }

  return (
    <div ref={ref} className={`overflow-hidden rounded-xl ${className}`} style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-adtest={process.env.NODE_ENV !== 'production' ? 'on' : undefined}
      />
    </div>
  )
}
