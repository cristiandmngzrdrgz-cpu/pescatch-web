import { Fish, Target, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Sobre PesCatch</h1>

      <div className="space-y-8" style={{ color: '#8BA3C7' }}>
        <section>
          <p className="text-lg leading-relaxed">
            PesCatch nació de una idea simple: <strong style={{ color: '#E8F0FE' }}>encontrar los mejores chollos
            de material de pesca para que tú solo tengas que pescar.</strong>
          </p>
          <p className="text-lg leading-relaxed mt-4">
            Somos pescadores y sabemos lo caro que puede llegar a ser el material. Por eso buscamos,
            verificamos y publicamos las mejores ofertas en tiendas online de confianza.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Target, title: 'Misión', text: 'Que ningún pescador pague de más por material de calidad.', color: '#00D4FF' },
            { icon: Shield, title: 'Verificación', text: 'Cada chollo es verificado manualmente. Si no es una oferta real, no se publica.', color: '#26DE81' },
            { icon: Fish, title: 'Comunidad', text: 'Hecho por pescadores, para pescadores. Entendemos tu pasión.', color: '#FFB800' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl p-5 text-center"
              style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${item.color}15` }}>
                <item.icon className="h-6 w-6" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: '#E8F0FE' }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#4A6080' }}>{item.text}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Cómo verificamos los chollos</h2>
          <div className="space-y-3">
            {[
              'Monitorizamos precios en Amazon, AliExpress, Decathlon, eBay y más tiendas.',
              'Comparamos con el precio medio del mercado.',
              'Solo publicamos deals con al menos un 15% de descuento real.',
              'Verificamos disponibilidad, envío y reputación de la tienda.',
              'Actualizamos los precios diariamente.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="font-bold mt-0.5" style={{ color: '#00D4FF' }}>{i + 1}.</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Contacto</h2>
          <p className="text-sm leading-relaxed">
            ¿Tienes alguna pregunta, sugerencia o has encontrado un error? Escríbenos a{' '}
            <a href="mailto:contacto@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              contacto@pescatch.es
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
