/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { buildTelegramMessage, isTelegramConfigured, sendTelegramMessage, pinTelegramMessage } from '@/lib/telegram'
import { buildXText, isXConfigured, postTweet } from '@/lib/x-client'
import { callGroq } from '@/lib/ai-providers/groq'
import { setCronState } from '@/lib/cron-state'

export async function POST() {
  const auth = await adminApiCheck()
  if (auth) return auth
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
    if (!deals.length) return NextResponse.json({ success: false, error: 'no_deals' }, { status: 400 })

    // build copy (Groq + fallback)
    let telegram = buildTelegramMessage(deals.slice(0, 8))
    let x = buildXText(deals)
    let usedFallback = true
    if (process.env.GROQ_API_KEY) {
      const block = deals
        .slice(0, 3)
        .map((d: any) => `- ${d.title} | ${d.salePrice.toFixed(2)}€ (antes ${d.originalPrice.toFixed(2)}€)`)
        .join('\n')
      const raw = await callGroq(
        [
          { role: 'system', content: 'Pescador promo JSON.' },
          { role: 'user', content: `Deals:\n${block}\nJSON {"telegram":"...","x":"..."}` },
        ],
        { temperature: 0.7, maxTokens: 900 }
      )
      if (raw) {
        try {
          const j = JSON.parse(raw.replace(/```json|```/g, '').trim())
          if (deals.some((d: any) => j.telegram?.includes(d.salePrice.toFixed(2)))) {
            telegram = (j.telegram as string).slice(0, 1000)
            x = (j.x as string).slice(0, 280)
            usedFallback = false
          }
        } catch {}
      }
    }

    let tgRes: any = { configured: isTelegramConfigured(), sent: false }
    if (isTelegramConfigured()) {
      const r = await sendTelegramMessage(telegram)
      tgRes = { ...tgRes, sent: r.ok, error: r.error, messageId: r.messageId }
      if (r.ok && r.messageId) {
        const p = await pinTelegramMessage(r.messageId)
        tgRes.pinned = p.ok
      }
    }
    let xRes: any = { configured: isXConfigured(), sent: false }
    if (isXConfigured()) {
      const r = await postTweet(x)
      xRes = { sent: r.ok, error: r.error, id: r.id }
    } else xRes.skipped = true

    await setCronState('last_promo_sent', new Date().toISOString())
    return NextResponse.json({ success: true, usedFallback, telegramPreview: telegram.slice(0, 300), xPreview: x.slice(0, 120), tgRes, xRes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function GET() {
  const auth = await adminApiCheck()
  if (auth) return auth
  // preview only
  await seedDatabase()
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT title, salePrice, originalPrice, discountPercent, storeName, slug, commission, storeId FROM deals WHERE status='published' AND discountPercent>0 ORDER BY commission DESC LIMIT 8`,
  })
  const deals = res.rows as unknown as Array<any>
  if (!deals.length) return NextResponse.json({ telegram: '', x: '' })
  return NextResponse.json({ telegram: buildTelegramMessage(deals.slice(0, 8)), x: buildXText(deals), dealsCount: deals.length, xConfigured: isXConfigured(), tgConfigured: isTelegramConfigured() })
}
