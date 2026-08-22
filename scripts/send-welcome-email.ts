import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { sendEmail, isEmailConfigured, buildWelcomeHtml } from '../src/lib/email'
import { getDeals } from '../src/data/queries'

const BASE_URL = 'https://www.pescatch.es'

async function sendWelcomeEmail() {
  if (!isEmailConfigured()) {
    console.error('❌ Resend no configurado. Añade RESEND_API_KEY en .env')
    process.exit(1)
  }

  const testEmail = process.argv[2]
  if (!testEmail) {
    console.error('❌ Uso: npx tsx scripts/send-welcome-email.ts email@test.com')
    process.exit(1)
  }

  await seedDatabase()
  
  const topDeals = await getDeals({ sortBy: 'discount' })
  const welcomeDeals = topDeals.slice(0, 3).map(d => ({
    title: d.title,
    salePrice: d.salePrice,
    originalPrice: d.originalPrice,
    discountPercent: d.discountPercent,
    storeName: d.store.name,
    slug: d.slug,
    imageUrl: d.imageUrl || undefined,
  }))

  const guideUrl = `${BASE_URL}/blog/como-elegir-equipo-pesca`
  const html = buildWelcomeHtml(welcomeDeals, guideUrl)

  console.log(`📧 Enviando email de bienvenida a ${testEmail}...`)
  const ok = await sendEmail(testEmail, '🎣 ¡Bienvenido a PesCatch! Top chollos + Guía gratis', html)
  
  if (ok) {
    console.log('✅ Email enviado correctamente')
  } else {
    console.error('❌ Error al enviar email')
    process.exit(1)
  }
}

sendWelcomeEmail().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})