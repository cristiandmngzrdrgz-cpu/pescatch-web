import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { seedDatabase } from '@/lib/seed'
import { getCronState, setCronState } from '@/lib/cron-state'
import {
  buildTelegramMessage,
  isTelegramConfigured,
  pinTelegramMessage,
  sendTelegramMessage,
  telegramDateHeading,
  unpinTelegramMessage,
} from '@/lib/telegram'
import { markTelegramDealsSent, selectTelegramDeals } from '@/lib/telegram-selection'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
export const maxDuration = 300

const TELEGRAM_KEY = 'last_telegram_sent'
const PIN_KEY = 'last_telegram_pin_id'
const TELEGRAM_WINDOW_MS = 20 * 60 * 60 * 1000 // 20h (<24h para permitir reintento al día siguiente si falla el cron)

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram no configurado' }, { status: 500 })
  }

  try {
    await seedDatabase()

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === '1'

    if (!force) {
      const last = await getCronState(TELEGRAM_KEY)
      if (last) {
        const lastMs = Date.parse(last)
        if (!Number.isNaN(lastMs) && Date.now() - lastMs < TELEGRAM_WINDOW_MS) {
          return NextResponse.json({ success: true, sent: false, reason: 'idempotent', lastSent: last })
        }
      }
    }

    const deals = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    if (deals.length === 0) {
      return NextResponse.json({ success: true, sent: false, message: 'No hay chollos para publicar' })
    }

    const message = buildTelegramMessage(deals, {
      heading: telegramDateHeading('🎣 Chollos de la semana'),
    })
    const res = await sendTelegramMessage(message)

    let pinned = false
    if (res.ok) {
      await markTelegramDealsSent(deals, 'digest')

      const previousPin = Number(await getCronState(PIN_KEY))
      if (Number.isFinite(previousPin) && previousPin > 0) {
        await unpinTelegramMessage(previousPin)
      }
      if (res.messageId) {
        const pin = await pinTelegramMessage(res.messageId)
        pinned = pin.ok
        if (pin.ok) await setCronState(PIN_KEY, String(res.messageId))
      }

      await setCronState(TELEGRAM_KEY, new Date().toISOString())
    }

    return NextResponse.json({
      success: true,
      sent: res.ok,
      dealsCount: deals.length,
      deals: deals.map(d => d.slug),
      pinned,
      error: res.error,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en telegram: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
