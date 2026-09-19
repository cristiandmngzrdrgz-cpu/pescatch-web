import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata, BASE_URL } from '@/lib/seo/schemas'

export const metadata: Metadata = buildMetadata(
  {
    title: 'Canal Telegram PesCatch — chollos al instante',
    description: 'Únete al canal de Telegram de PesCatch. 1 mensaje lunes 09:05 con los 8 chollos más rentables, sin spam. High-ticket priorizado.',
    openGraph: { title: 'Telegram PesCatch', description: 'Chollos al instante sin spam', type: 'website', url: `${BASE_URL}/telegram` },
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
        <h1 className="text-3xl font-extrabold" style={{ color: '#E8F0FE' }}>Chollos al instante, sin spam</h1>
        <p className="mt-3 text-lg" style={{ color: '#8BA3C7' }}>
          1 mensaje a la semana con los 8 chollos más rentables (priorizamos los que más comisión te dejan). Nada de notificaciones diarias.
        </p>
        <ul className="mt-6 space-y-2 text-sm list-disc pl-5" style={{ color: '#8BA3C7' }}>
          <li>High-ticket primero: Stradic 179€ (9€) antes que kit 16€ (0.85€)</li>
          <li>Link directo con tu tag <code>pescatch-21</code> — compras cuentan igual que en web</li>
          <li>Sin spam, silenciado por defecto. Te pingeamos solo lo bueno.</li>
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="https://t.me/pescatch" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold" style={{ background: '#00D4FF', color: '#0B1120' }}>
            Únete gratis en Telegram →
          </a>
          <Link href="/top-chollos" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold" style={{ background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
            Ver chollos en web
          </Link>
        </div>
        <p className="text-xs mt-4" style={{ color: '#4A6080' }}>QR: t.me/pescatch — añádelo a tu bio de Instagram/YouTube para captar desde Google.</p>
      </div>
      <div className="mt-8 text-center text-sm" style={{ color: '#4A6080' }}>
        ¿Prefieres email? <Link href="/#newsletter" style={{ color: '#00D4FF' }}>Suscríbete al newsletter lunes 09:00</Link>
      </div>
    </div>
  )
}
