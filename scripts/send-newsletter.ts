import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { sendEmail, isEmailConfigured, buildNewsletterHtml } from '../src/lib/email'

const BASE_URL = 'https://pescatch.es'

async function sendNewsletter() {
  if (!isEmailConfigured()) {
    console.error('❌ Resend no configurado. Añade RESEND_API_KEY en .env')
    process.exit(1)
  }

  await seedDatabase()
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.imageUrl
          FROM deals d
          WHERE d.status = 'published' AND d.discountPercent > 0
          ORDER BY d.discountPercent DESC
          LIMIT 10`,
  })

  const deals = result.rows as unknown as Array<{
    title: string
    salePrice: number
    originalPrice: number
    discountPercent: number
    storeName: string
    slug: string
    imageUrl: string | null
  }>

  if (deals.length === 0) {
    console.log('❌ No hay chollos para enviar.')
    return
  }

  const subscribers = await db.execute({
    sql: 'SELECT email FROM subscribers',
  })

  const emails = subscribers.rows.map(r => r.email as string)
  console.log(`📧 Enviando newsletter a ${emails.length} suscriptores con ${deals.length} chollos...`)

  let sent = 0
  let failed = 0

  for (const email of emails) {
    const unsubscribeUrl = `${BASE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
    const html = buildNewsletterHtml(
      deals.map(d => ({
        title: d.title,
        salePrice: d.salePrice,
        originalPrice: d.originalPrice,
        discountPercent: d.discountPercent,
        storeName: d.storeName,
        slug: d.slug,
        imageUrl: d.imageUrl || undefined,
      })),
      unsubscribeUrl,
    )

    const ok = await sendEmail(email, '🎣 Chollos de la semana — PesCatch', html)
    if (ok) sent++
    else failed++
  }

  console.log(`✅ Enviados: ${sent} | Fallos: ${failed}`)
}

sendNewsletter().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
