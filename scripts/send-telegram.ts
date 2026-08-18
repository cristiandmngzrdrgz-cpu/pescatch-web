import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { isTelegramConfigured, buildTelegramMessage, sendTelegramMessage } from '../src/lib/telegram'

async function sendTelegram() {
  if (!isTelegramConfigured()) {
    console.error('❌ Telegram no configurado. Añade TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL_ID en .env')
    process.exit(1)
  }

  await seedDatabase()
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug
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
  }>

  if (deals.length === 0) {
    console.log('❌ No hay chollos para publicar en Telegram.')
    return
  }

  const message = buildTelegramMessage(deals)
  console.log(`📣 Publicando ${deals.length} chollos en Telegram...`)

  const res = await sendTelegramMessage(message)
  if (res.ok) {
    console.log('✅ Mensaje publicado en el canal.')
  } else {
    console.error(`❌ Error enviando a Telegram: ${res.error}`)
    process.exit(1)
  }
}

sendTelegram().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})