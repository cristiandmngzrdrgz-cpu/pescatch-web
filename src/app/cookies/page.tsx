export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Política de Cookies</h1>
      <p className="text-sm mb-8" style={{ color: '#8BA3C7' }}>Última actualización: 28 de junio de 2026</p>

      <div className="space-y-8" style={{ color: '#8BA3C7' }}>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>1. ¿Qué son las cookies?</h2>
          <p className="text-sm leading-relaxed">
            Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario
            cuando visita un sitio web. Permiten recordar preferencias y mejorar la experiencia de navegación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>2. Cookies que utilizamos</h2>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#00D4FF' }}>Cookies propias</h3>
              <p className="text-sm">Utilizamos localStorage para guardar:</p>
              <ul className="text-sm mt-2 space-y-1 ml-5 list-disc">
                <li>Favoritos del usuario (sin datos personales)</li>
                <li>Historial de votos (para evitar votos repetidos)</li>
              </ul>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#FFB800' }}>Cookies de afiliados</h3>
              <p className="text-sm">Cuando haces clic en un enlace de afiliado (Amazon, Awin, etc.), esas
                plataformas pueden instalar cookies propias para rastrear la compra. Estas cookies las
                gestionan terceros y están sujetas a sus propias políticas de privacidad.</p>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#26DE81' }}>Cookies de analítica</h3>
              <p className="text-sm">Utilizamos herramientas de analítica respetuosas con la privacidad
                (Plausible, Fathom o similar) que no utilizan cookies de rastreo y cumplen con el RGPD.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>3. Cómo gestionar las cookies</h2>
          <p className="text-sm leading-relaxed">
            Puedes configurar tu navegador para bloquear o eliminar cookies. Consulta la ayuda de tu
            navegador para saber cómo hacerlo. Ten en cuenta que desactivar las cookies puede afectar
            a la funcionalidad del sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>4. Cookies de terceros</h2>
          <p className="text-sm leading-relaxed">
            Los enlaces de afiliado redirigen a sitios de terceros (Amazon, AliExpress, Decathlon, etc.)
            que tienen sus propias políticas de cookies. Recomendamos revisar las políticas de cada
            plataforma antes de realizar una compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>5. Cambios en esta política</h2>
          <p className="text-sm leading-relaxed">
            Nos reservamos el derecho de modificar esta política de cookies en cualquier momento.
            Los cambios se publicarán en esta página.
          </p>
        </section>
      </div>
    </div>
  )
}
