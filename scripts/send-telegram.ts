import 'dotenv/config'
import { seedDatabase } from '../src/lib/seed'
import { getCronState, setCronState } from '../src/lib/cron-state'
import {
  buildTelegramMessage,
  isTelegramConfigured,
  pinTelegramMessage,
  sendTelegramMessage,
  telegramDateHeading,
  unpinTelegramMessage,
} from '../src/lib/telegram'
import { markTelegramDealsSent, selectTelegramDeals } from '../src/lib/telegram-selection'

const TELEGRAM_KEY = 'last_telegram_sent'
const PIN_KEY = 'last_telegram_pin_id'

async function sendTelegram() {
  const dryRun = process.argv.includes('--dry-run')

  if (!isTelegramConfigured() && !dryRun) {
    console.error('❌ Telegram no configurado. Añade TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL_ID en .env')
    process.exit(1)
  }

  await seedDatabase()

  // Digest: hasta 5 recientes + los mejores antiguos, con rotación de 21 días.
  const deals = await selectTelegramDeals({ mode: 'digest', limit: 8 })
  if (deals.length === 0) {
    console.log('❌ No hay chollos para publicar en Telegram.')
    return
  }

  const message = buildTelegramMessage(deals, {
    heading: telegramDateHeading('🎣 Chollos de la semana'),
  })

  if (dryRun) {
    console.log(`[DRY-RUN] ${deals.length} chollos (no se publica):\n`)
    console.log(message)
    return
  }

  console.log(`📣 Publicando ${deals.length} chollos en Telegram...`)
  const res = await sendTelegramMessage(message)

  if (!res.ok) {
    console.error(`❌ Error enviando a Telegram: ${res.error}`)
    process.exit(1)
  }

  await markTelegramDealsSent(deals, 'digest')

  const previousPin = Number(await getCronState(PIN_KEY))
  if (Number.isFinite(previousPin) && previousPin > 0) {
    await unpinTelegramMessage(previousPin)
  }
  if (res.messageId) {
    const pin = await pinTelegramMessage(res.messageId)
    if (pin.ok) {
      await setCronState(PIN_KEY, String(res.messageId))
      console.log('📌 Mensaje fijado en el canal.')
    } else {
      console.warn(`⚠️ No se pudo fijar: ${pin.error}`)
    }
  }

  await setCronState(TELEGRAM_KEY, new Date().toISOString())
  console.log('✅ Mensaje publicado en el canal.')
}

sendTelegram().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
