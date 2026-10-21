import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata, BASE_URL } from '@/lib/seo/schemas'

export const metadata: Metadata = buildMetadata(
  {
    title: 'Canal Telegram PesCatch — 8 chollos de pesca cada lunes',
    description: 'Únete al canal de Telegram de PesCatch. Un mensaje cada lunes a las 09:05 con 8 chollos de pesca seleccionados, precios verificados y sin spam.',
    openGraph: { title: 'Telegram PesCatch', description: 'Ocho chollos de pesca seleccionados, una vez a la semana.', type: 'website', url: `${BASE_URL}/telegram` },
  },
  `${BASE_URL}/telegram`
)

export default function TelegramPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl p-8 md:p-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
          Telegram · @pescatch · lunes 09:05
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: '#E8F0FE' }}>Chollos de pesca seleccionados, sin spam</h1>
        <p className="mt-3 text-lg" style={{ color: '#8BA3C7' }}>
          Cada lunes a las 09:05 recibes 8 chollos de pesca seleccionados: precio verificado, enlace directo y cero notificaciones diarias.
        </p>
        <ul className="mt-6 space-y-2 text-sm list-disc pl-5" style={{ color: '#8BA3C7' }}>
          <li>Cañas, carretes, señuelos y accesorios con descuento real.</li>
          <li>Precios contrastados antes de publicar y enlace directo a la tienda.</li>
          <li>Un mensaje a la semana. Sin ruido y sin spam.</li>
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="https://t.me/pescatch" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold" style={{ background: '#00D4FF', color: '#0B1120' }}>
            Únete gratis en Telegram →
          </a>
          <Link href="/top-chollos" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold" style={{ background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
            Ver chollos en web
          </Link>
        </div>
        <p className="text-xs mt-4" style={{ color: '#4A6080' }}>Puedes salir del canal cuando quieras.</p>
      </div>
      <div className="mt-8 text-center text-sm" style={{ color: '#4A6080' }}>
        ¿Prefieres email? <Link href="/#newsletter" style={{ color: '#00D4FF' }}>Suscríbete al newsletter lunes 09:00</Link>
      </div>
    </div>
  )
}
