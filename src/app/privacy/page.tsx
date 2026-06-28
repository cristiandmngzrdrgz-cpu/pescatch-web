export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Política de Privacidad</h1>
      <p className="text-sm mb-8" style={{ color: '#8BA3C7' }}>Última actualización: 28 de junio de 2026</p>

      <div className="space-y-8" style={{ color: '#8BA3C7' }}>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>1. Responsable del tratamiento</h2>
          <p className="text-sm leading-relaxed">
            PesCatch (en adelante, &quot;el Responsable&quot;) es el responsable del tratamiento de los datos personales
            de los usuarios de la web pescatch.es. Si tienes preguntas, puedes contactarnos a través de
            contacto@pescatch.es.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>2. Datos que recogemos</h2>
          <p className="text-sm leading-relaxed mb-3">
            Recogemos únicamente los datos que el usuario proporciona voluntariamente:
          </p>
          <ul className="text-sm space-y-1.5 ml-5 list-disc">
            <li>Nombre y dirección de email (solo en el formulario de newsletter)</li>
            <li>Nombre y contenido de comentarios (cuando el usuario comenta en un deal)</li>
            <li>Datos de navegación básicos a través de herramientas de analítica (Plausible o similar)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>3. Finalidad del tratamiento</h2>
          <p className="text-sm leading-relaxed">Los datos se utilizan exclusivamente para:</p>
          <ul className="text-sm space-y-1.5 ml-5 list-disc mt-2">
            <li>Enviar newsletters con chollos de pesca (solo si el usuario se suscribe)</li>
            <li>Publicar los comentarios que el usuario envíe</li>
            <li>Analizar el tráfico web para mejorar el servicio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>4. Base legal</h2>
          <p className="text-sm leading-relaxed">
            El tratamiento se basa en el consentimiento explícito del usuario (art. 6.1.a RGPD) y en el
            interés legítimo del Responsable de mejorar su servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>5. Enlaces de afiliado</h2>
          <p className="text-sm leading-relaxed">
            PesCatch participa en programas de afiliación (Amazon, Awin, etc.). Cuando un usuario hace clic
            en un enlace de afiliado y realiza una compra, recibimos una comisión. Esto no supone un coste
            adicional para el usuario. Los enlaces de afiliado pueden recoger cookies de terceros según las
            políticas de cada plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>6. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Utilizamos cookies propias y de terceros. Para más información, consulta nuestra{' '}
            <a href="/cookies" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>Política de Cookies</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>7. Derechos del usuario</h2>
          <p className="text-sm leading-relaxed">Tienes derecho a:</p>
          <ul className="text-sm space-y-1.5 ml-5 list-disc mt-2">
            <li>Acceder a tus datos personales</li>
            <li>Solicitar la rectificación o eliminación de tus datos</li>
            <li>Oponerte al tratamiento o solicitar la limitación</li>
            <li>Portabilidad de datos</li>
            <li>Retirar el consentimiento en cualquier momento</li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            Para ejercer estos derechos, envía un email a contacto@pescatch.es con una copia de tu DNI.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>8. Conservación de datos</h2>
          <p className="text-sm leading-relaxed">
            Los datos personales se conservarán mientras el usuario mantenga su suscripción o no solicite
            su eliminación. Los datos de navegación se eliminan automáticamente tras 26 meses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>9. Seguridad</h2>
          <p className="text-sm leading-relaxed">
            Implementamos medidas técnicas y organizativas para proteger los datos personales, incluyendo
            cifrado HTTPS, acceso restringido y políticas de seguridad de la información.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E8F0FE' }}>10. Cambios en la política</h2>
          <p className="text-sm leading-relaxed">
            Nos reservamos el derecho de modificar esta política. Los cambios se publicarán en esta página
            con la fecha de última actualización.
          </p>
        </section>
      </div>
    </div>
  )
}
