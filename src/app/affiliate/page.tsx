export default function AffiliatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Programa de Afiliados</h1>
      <p className="text-sm mb-8" style={{ color: '#8BA3C7' }}>Última actualización: 28 de junio de 2026</p>

      <div className="space-y-8" style={{ color: '#8BA3C7' }}>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>¿Qué son los enlaces de afiliado?</h2>
          <p className="text-sm leading-relaxed">
            PesCatch forma parte de varios programas de afiliación. Cuando haces clic en un enlace de
            &quot;Comprar&quot; y realizas una compra en la tienda correspondiente, recibimos una pequeña comisión
            por la venta. Esto <strong style={{ color: '#26DE81' }}>no incrementa el precio</strong> que pagas
            — es la tienda quien nos paga una parte de su beneficio por haberte dirigido a ella.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Nuestros socios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Amazon Associates', desc: 'El programa de afiliados de Amazon. Comisiones entre 1-10% según categoría.', url: 'https://affiliate-program.amazon.es' },
              { name: 'Awin (Decathlon)', desc: 'Red de afiliados que incluye tiendas como Decathlon, El Corte Inglés y más.', url: 'https://www.awin.com/es' },
              { name: 'AliExpress Affiliate', desc: 'Programa de afiliados de AliExpress para productos de pesca.', url: 'https://portals.aliexpress.com' },
              { name: 'eBay Partner Network', desc: 'Programa de afiliados de eBay para productos de segunda mano y nuevos.', url: 'https://partnernetwork.ebay.es' },
            ].map((partner) => (
              <div key={partner.name} className="rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                <h3 className="font-semibold text-sm mb-1" style={{ color: '#00D4FF' }}>{partner.name}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#4A6080' }}>{partner.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>¿Cómo funciona?</h2>
          <div className="space-y-3 text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: '#00D4FF' }}>1.</span>
              <p>Encuentras un chollo que te interesa en PesCatch.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: '#00D4FF' }}>2.</span>
              <p>Haces clic en el botón &quot;Comprar en [tienda]&quot;.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: '#00D4FF' }}>3.</span>
              <p>Te redirigimos a la tienda con un enlace especial que nos identifica como referente.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: '#00D4FF' }}>4.</span>
              <p>Si compras, la tienda nos paga una comisión por haberte recomendado el producto.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: '#26DE81' }}>5.</span>
              <p>Tú pagas exactamente el mismo precio que si hubieras entrado directamente a la tienda.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Transparencia</h2>
          <p className="text-sm leading-relaxed">
            Creemos en la transparencia total. Por eso:
          </p>
          <ul className="text-sm space-y-1.5 ml-5 list-disc mt-2">
            <li>Cada deal indica claramente la tienda de origen</li>
            <li>Los precios mostrados son los precios reales de la tienda</li>
            <li>No cobramos al usuario por ningún servicio</li>
            <li>Nuestro objetivo es ayudarte a ahorrar, no a gastar más</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Exención de responsabilidad</h2>
          <p className="text-sm leading-relaxed">
            En calidad de afiliado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los
            requisitos aplicables. Los precios y disponibilidad están sujetos a cambios por parte de las
            tiendas. PesCatch no se hace responsable de errores en los precios publicados.
          </p>
        </section>
      </div>
    </div>
  )
}
