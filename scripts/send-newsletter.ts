import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { sendEmail, isEmailConfigured, buildNewsletterHtml } from '../src/lib/email'

const BASE_URL = 'https://www.pescatch.es'

async function sendNewsletter() {
  if (!isEmailConfigured()) {
    console.error('❌ Resend no configurado. Añade RESEND_API_KEY en .env')
    process.exit(1)
  }

  await seedDatabase()
  const db = getDb()

  // Spec §5.5: 3 high-ticket (commission) + 3 por descuento — sin duplicar
  const high = await db.execute({
    sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.imageUrl, d.commission
          FROM deals d WHERE d.status='published' AND d.discountPercent>0 ORDER BY d.commission DESC LIMIT 3`,
  })
  const highSlugs = (high.rows as any[]).map((r: any) => r.slug)
  const placeholders = highSlugs.map(() => '?').join(',')
  const discSql = highSlugs.length
    ? `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.imageUrl
       FROM deals d WHERE d.status='published' AND d.discountPercent>0 AND d.slug NOT IN (${placeholders}) ORDER BY d.discountPercent DESC LIMIT 3`
    : `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.imageUrl
       FROM deals d WHERE d.status='published' AND d.discountPercent>0 ORDER BY d.discountPercent DESC LIMIT 3`
  const disc = await db.execute({ sql: discSql, args: highSlugs })
  const rows = [...(high.rows as any[]), ...(disc.rows as any[])]
  const result = { rows } as any

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
    const unsubscribeUrl = `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
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
