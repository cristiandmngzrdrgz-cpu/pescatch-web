export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6" style={{ color: '#E8F0FE' }}>Contacto</h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7' }}>
        ¿Tienes alguna pregunta o sugerencia? Escríbenos.
      </p>

      <div className="space-y-6">
        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Email</h2>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>
            Para consultas generales:{' '}
            <a href="mailto:contacto@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              contacto@pescatch.es
            </a>
          </p>
          <p className="text-sm mt-2" style={{ color: '#8BA3C7' }}>
            Para reportar un error en un deal:{' '}
            <a href="mailto:errores@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              errores@pescatch.es
            </a>
          </p>
          <p className="text-sm mt-2" style={{ color: '#8BA3C7' }}>
            Para propuestas de colaboración:{' '}
            <a href="mailto:colaboraciones@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
              colaboraciones@pescatch.es
            </a>
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Síguenos</h2>
          <p className="text-sm" style={{ color: '#8BA3C7' }}>
            Próximamente estaremos en redes sociales. Suscríbete a la newsletter para enterarte primero.
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <h2 className="font-bold mb-2" style={{ color: '#E8F0FE' }}>¿Has visto un chollo?</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#8BA3C7' }}>
            Si encuentras una oferta de pesca que crees que debería estar en PesCatch, envíanos el enlace
            a <a href="mailto:contacto@pescatch.es" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>contacto@pescatch.es</a> y lo revisaremos.
          </p>
        </div>
      </div>
    </div>
  )
}
