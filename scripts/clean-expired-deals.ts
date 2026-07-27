import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '../src/lib/email'

async function cleanExpiredDeals() {
  await seedDatabase()
  const db = getDb()

  console.log('=== Limpieza de deals expirados ===\n')

  const now = new Date().toISOString()

  const result = await db.execute({
    sql: `SELECT id, title, slug, expiresAt FROM deals WHERE expiresAt IS NOT NULL AND expiresAt <= ? AND status = 'published'`,
    args: [now],
  })

  const expired = result.rows as unknown as Array<{
    id: string
    title: string
    slug: string
    expiresAt: string
  }>

  if (expired.length === 0) {
    console.log('✅ No hay deals expirados.')
    return
  }

  const ids = expired.map(d => d.id)

  await db.execute({
    sql: `UPDATE deals SET status = 'draft', updatedAt = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
    args: [now, ...ids],
  })

  for (const deal of expired) {
    console.log(`  ⏳ Marcado como expirado: "${deal.title}" (expiró ${deal.expiresAt})`)
  }

  console.log(`\n✅ ${expired.length} deals marcados como expirados.`)

  if (isEmailConfigured()) {
    const items = expired.slice(0, 10).map(d => `<li>${d.title} (expiró ${d.expiresAt.slice(0, 10)})</li>`).join('')
    await sendAdminNotification(
      `${expired.length} deals expirados`,
      buildAdminNotificationHtml('Deals expirados', `
        <p>Se marcaron ${expired.length} deals como expirados:</p>
        <ul>${items}</ul>
        ${expired.length > 10 ? `<p>...y ${expired.length - 10} más.</p>` : ''}
      `),
    )
    console.log('📧 Notificación enviada al admin.')
  }
}

cleanExpiredDeals().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
