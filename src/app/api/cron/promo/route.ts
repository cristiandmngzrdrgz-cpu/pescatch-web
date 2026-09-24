/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { buildTelegramMessage, isTelegramConfigured, sendTelegramMessage, pinTelegramMessage } from '@/lib/telegram'
import { buildXText, isXConfigured, postTweet } from '@/lib/x-client'
import { getCronState, setCronState } from '@/lib/cron-state'
import { callGroq } from '@/lib/ai-providers/groq'

export const maxDuration = 300
const PROMO_KEY = 'last_promo_sent'
const WINDOW_MS = 20 * 60 * 60 * 1000 // idempotencia 20h
const ALLOWED_DAYS = [1, 3, 5] // lunes, miércoles, viernes (0=dom)

function isPromoDay(d: Date): boolean {
  return ALLOWED_DAYS.includes(d.getUTCDay())
}

async function buildCopy(deals: any[]): Promise<{ telegram: string; x: string; usedFallback: boolean }> {
  const fallbackTg = buildTelegramMessage(deals.slice(0, 8))
  const fallbackX = buildXText(deals)
  if (!process.env.GROQ_API_KEY) return { telegram: fallbackTg, x: fallbackX, usedFallback: true }
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
    { temperature: 0.7, maxTokens: 900 }
  )
  if (!raw) return { telegram: fallbackTg, x: fallbackX, usedFallback: true }
  try {
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim())
    const okPrice = deals.some((d: any) => j.telegram?.includes(d.salePrice.toFixed(2)))
    if (!okPrice) return { telegram: fallbackTg, x: fallbackX, usedFallback: true }
    return { telegram: (j.telegram as string).slice(0, 1000), x: (j.x as string).slice(0, 280), usedFallback: false }
  } catch {
    return { telegram: fallbackTg, x: fallbackX, usedFallback: true }
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
  try {
    await seedDatabase()
    const db = getDb()
    const res = await db.execute({
      sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId FROM deals d WHERE d.status='published' AND d.discountPercent>0 ORDER BY d.commission DESC, d.discountPercent DESC LIMIT 8`,
    })
    let deals = res.rows as unknown as Array<any>
    if (!deals.some((d: any) => d.storeId === 'aliexpress')) {
      const ae = await db.execute({
        sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId FROM deals d WHERE d.status='published' AND d.storeId='aliexpress' AND d.discountPercent>0 ORDER BY d.commission DESC LIMIT 1`,
      })
      if (ae.rows.length) deals = [...deals.slice(0, 7), ...(ae.rows as unknown as any[])]
    }
    if (!deals.length) return NextResponse.json({ success: true, skipped: true, reason: 'no_deals' })
    const { telegram, x, usedFallback } = await buildCopy(deals)

    let tgOk = false
    let tgError: string | undefined
    let pinOk: boolean | undefined
    if (isTelegramConfigured()) {
      const r = await sendTelegramMessage(telegram)
      tgOk = r.ok
      tgError = r.error
      if (r.ok && r.messageId) {
        const p = await pinTelegramMessage(r.messageId)
        pinOk = p.ok
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
      telegram: { sent: tgOk, error: tgError, pinned: pinOk, configured: isTelegramConfigured() },
      x: { sent: xOk, error: xError, id: xId, configured: isXConfigured(), skipped: xSkipped, textPreview: x.slice(0, 80) },
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
