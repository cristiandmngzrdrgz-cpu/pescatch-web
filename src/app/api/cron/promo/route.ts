/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { seedDatabase } from '@/lib/seed'
import { buildTelegramMessage, isTelegramConfigured, sendTelegramMessage, telegramDateHeading } from '@/lib/telegram'
import { buildXText, isXConfigured, postTweet } from '@/lib/x-client'
import { getCronState, setCronState } from '@/lib/cron-state'
import { callGroq } from '@/lib/ai-providers/groq'
import { markTelegramDealsSent, selectTelegramDeals, type TelegramDealCandidate } from '@/lib/telegram-selection'

export const maxDuration = 300
const PROMO_KEY = 'last_promo_sent'
const WINDOW_MS = 20 * 60 * 60 * 1000 // idempotencia 20h
const ALLOWED_DAYS = [1, 3, 5] // lunes, miércoles, viernes (0=dom)
const TELEGRAM_DAY = 3 // miércoles: novedades en Telegram; lunes/viernes solo X

function isPromoDay(d: Date): boolean {
  return ALLOWED_DAYS.includes(d.getUTCDay())
}

function includesPrice(text: string, price: number): boolean {
  const compact = text.replace(/\s/g, '')
  const fixed = price.toFixed(2)
  return compact.includes(fixed) || compact.includes(fixed.replace('.', ','))
}

async function buildCopy(
  deals: TelegramDealCandidate[],
  includeTelegram: boolean,
): Promise<{ telegram: string; x: string; usedFallback: boolean }> {
  const fallbackTg = includeTelegram
    ? buildTelegramMessage(deals.slice(0, 8), { heading: telegramDateHeading('🆕 Novedades de pesca') })
    : ''
  const fallbackX = buildXText(deals)
  const fallback = () => ({ telegram: fallbackTg, x: fallbackX, usedFallback: true })

  if (!process.env.GROQ_API_KEY) return fallback()

  const block = deals
    .slice(0, 3)
    .map((d: any) => `- ${d.title} | ${d.salePrice.toFixed(2)}€ (antes ${d.originalPrice.toFixed(2)}€, -${d.discountPercent}%) ${`https://www.pescatch.es/deals/${d.slug}`}`)
    .join('\n')
  const raw = await callGroq(
    [
      { role: 'system', content: 'Eres pescador gallego, promo corta sin tono IA. Devuelve solo JSON.' },
      {
        role: 'user',
        content: `Deals:\n${block}\n\nDevuelve JSON {"telegram":"<b>gancho</b> + lista HTML","x":"280c"}. Telegram usa <a href> <b> <s>, máx 900c. X 240-280c, 2 chollos + https://www.pescatch.es/top-chollos #pesca. No inventes precios.`,
      },
    ],
    { temperature: 0.7, maxTokens: 900, reasoningEffort: 'low' }
  )
  if (!raw) return fallback()

  try {
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim())
    const telegram = typeof j.telegram === 'string' ? j.telegram.trim() : ''
    const x = typeof j.x === 'string' ? j.x.trim() : ''

    const telegramOk =
      !includeTelegram ||
      (telegram.length > 0 &&
        telegram.includes('/deals/') &&
        deals.some(d => includesPrice(telegram, d.salePrice)))
    const xOk = x.length > 0 && deals.some(d => includesPrice(x, d.salePrice))

    if (!telegramOk || !xOk) return fallback()

    return {
      telegram: includeTelegram ? telegram.slice(0, 1000) : '',
      x: x.slice(0, 280),
      usedFallback: false,
    }
  } catch {
    return fallback()
  }
}

async function handle(request: NextRequest) {
  const auth = verifyCronAuth(request)
  if (auth) return auth
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === '1'
  const now = new Date()
  if (!force && !isPromoDay(now)) {
    return NextResponse.json({ success: true, skipped: true, reason: 'not_promo_day', day: now.getUTCDay() })
  }
  if (!force) {
    const last = await getCronState(PROMO_KEY)
    if (last) {
      const ms = Date.parse(last)
      if (!Number.isNaN(ms) && Date.now() - ms < WINDOW_MS) {
        return NextResponse.json({ success: true, skipped: true, reason: 'idempotent', last })
      }
    }
  }
  if (!isTelegramConfigured() && !isXConfigured()) {
    return NextResponse.json({ error: 'Ningún canal configurado (Telegram/X)' }, { status: 500 })
  }

  const sendTelegramToday = now.getUTCDay() === TELEGRAM_DAY

  try {
    await seedDatabase()

    const deals = await selectTelegramDeals({
      mode: sendTelegramToday ? 'fresh' : 'digest',
      limit: 8,
    })
    if (!deals.length) {
      return NextResponse.json({ success: true, skipped: true, reason: 'no_deals' })
    }

    const { telegram, x, usedFallback } = await buildCopy(deals, sendTelegramToday)

    let tgOk = false
    let tgError: string | undefined
    if (sendTelegramToday) {
      if (isTelegramConfigured()) {
        const r = await sendTelegramMessage(telegram)
        tgOk = r.ok
        tgError = r.error
        if (r.ok) {
          // Consume la rotación solo cuando el mensaje salió de verdad.
          await markTelegramDealsSent(deals, 'fresh')
        }
      } else {
        tgError = 'Telegram no configurado'
      }
    }

    let xOk: boolean | undefined
    let xError: string | undefined
    let xId: string | undefined
    let xSkipped = false
    if (isXConfigured()) {
      const r = await postTweet(x)
      xOk = r.ok
      xError = r.error
      xId = r.id
    } else xSkipped = true

    await setCronState(PROMO_KEY, new Date().toISOString())

    return NextResponse.json({
      success: true,
      dealsCount: deals.length,
      usedFallback,
      telegram: {
        policy: sendTelegramToday ? 'wednesday' : 'x-only',
        sent: tgOk,
        error: tgError,
        configured: isTelegramConfigured(),
      },
      x: {
        sent: xOk,
        error: xError,
        id: xId,
        configured: isXConfigured(),
        skipped: xSkipped,
        textPreview: x.slice(0, 80),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}
export async function POST(request: NextRequest) {
  return handle(request)
}
