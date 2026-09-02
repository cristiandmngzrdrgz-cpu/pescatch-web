'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie_consent' // 'granted' | 'denied' | null
const STORAGE_DATE = 'cookie_consent_date'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) {
      const id = window.setTimeout(() => setVisible(true), 0)
      return () => window.clearTimeout(id)
    }

    // Si ya hay consent guardado, aplicar update (el default denied ya va en layout beforeInteractive)
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (gtag && consent === 'granted') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      })
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'granted')
    localStorage.setItem(STORAGE_DATE, new Date().toISOString())
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (gtag) {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      })
    }
    setVisible(false)
    window.dispatchEvent(new Event('cookie_consent_updated'))
  }

  function deny() {
    localStorage.setItem(STORAGE_KEY, 'denied')
    localStorage.setItem(STORAGE_DATE, new Date().toISOString())
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (gtag) {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      })
    }
    setVisible(false)
    window.dispatchEvent(new Event('cookie_consent_updated'))
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div
        className="mx-auto max-w-3xl rounded-2xl p-4 shadow-xl"
        style={{ background: '#111827', border: '1px solid #1E3A5F' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#E8F0FE' }}>
          Usamos cookies propias y de terceros (incluido Google AdSense) para mostrar anuncios y analizar el tráfico.
        </p>
        <p className="text-xs mt-2" style={{ color: '#8BA3C7' }}>
          Puedes aceptar (anuncios personalizados) o rechazar (anuncios no personalizados). Más info en{' '}
          <a href="/cookies" className="underline" style={{ color: '#00D4FF' }}>
            Política de Cookies
          </a>{' '}
          y{' '}
          <a href="/privacy" className="underline" style={{ color: '#00D4FF' }}>
            Privacidad
          </a>
          .
        </p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={deny}
            className="rounded-full px-5 py-2 text-sm font-medium"
            style={{ background: 'transparent', border: '1px solid #1E3A5F', color: '#8BA3C7' }}
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: '#00D4FF', color: '#0B1120' }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
