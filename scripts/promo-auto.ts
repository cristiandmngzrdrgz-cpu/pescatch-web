// PROPÓSITO: Promo 3×/semana lunes/miércoles/viernes 09:10 — Telegram + X (draft si no hay keys)
// FECHA: 2026-09-23 — Opción A
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { buildTelegramMessage, isTelegramConfigured, sendTelegramMessage, pinTelegramMessage } from '../src/lib/telegram'
import { buildXText, isXConfigured, postTweet } from '../src/lib/x-client'
import { callGroq } from '../src/lib/ai-providers/groq'

const BASE_URL = 'https://www.pescatch.es'

type DealRow = { title: string; salePrice: number; originalPrice: number; discountPercent: number; storeName: string; slug: string; commission: number; storeId: string }

async function getTopDeals(): Promise<DealRow[]> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId
          FROM deals d WHERE d.status='published' AND d.discountPercent>0 ORDER BY d.commission DESC, d.discountPercent DESC LIMIT 8`,
  })
  let rows = res.rows as unknown as DealRow[]
  const hasAE = rows.some(r => r.storeId === 'aliexpress')
  if (!hasAE) {
    const ae = await db.execute({
      sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId
            FROM deals d WHERE d.status='published' AND d.storeId='aliexpress' AND d.discountPercent>0 ORDER BY d.commission DESC LIMIT 1`,
    })
    if (ae.rows.length) rows = [...rows.slice(0, 7), ...(ae.rows as unknown as DealRow[])]
  }
  return rows
}

async function buildPromoCopyAI(deals: DealRow[]): Promise<{ telegram: string | null; x: string | null }> {
  if (!process.env.GROQ_API_KEY) return { telegram: null, x: null }
  const dealsBlock = deals
    .slice(0, 3)
    .map(d => `- ${d.title} | ${d.salePrice.toFixed(2)}€ (antes ${d.originalPrice.toFixed(2)}€, -${d.discountPercent}%, com ${d.commission}€) ${BASE_URL}/deals/${d.slug} | ${d.storeName}`)
    .join('\n')
  const prompt = `Eres pescador gallego que comparte chollos con un colega. Escribe 2 promos a partir de estos deals (NO inventes precios, usa los reales):

${dealsBlock}

1) Telegram HTML (permitidos <b> <i> <a href=""> <code> <s>): 1 línea gancho + lista numerada "1. <a href>Title</a> — 12.34€ <s>23€</s> (-% )" + cierra "⚡ Últimas 24h → https://www.pescatch.es/top-chollos". Máx 900 caracteres, 1 emoji al inicio, urgencia 24h, sin spam.
2) X texto 280c: gancho + 2 chollos cortos "🎣 Title — 12€ → link" + cola "Más en https://www.pescatch.es/top-chollos #pesca #carpfishing". 240-280c.

Responde JSON {"telegram":"...","x":"..."} solo JSON, sin explicaciones.`

  const raw = await callGroq(
    [
      { role: 'system', content: 'Eres un pescador que escribe promos cortas, humanas y sin tono IA. Devuelves solo JSON válido.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 900 }
  )
  if (!raw) return { telegram: null, x: null }
  try {
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim())
    // validación mínima precio real en mensaje
    const checkPrice = deals.some(d => j.telegram?.includes(d.salePrice.toFixed(2)) || j.telegram?.includes(d.salePrice.toFixed(2).replace('.', ',')))
    if (!checkPrice) return { telegram: null, x: null }
    if (j.x && j.x.length > 280) j.x = j.x.slice(0, 280)
    return { telegram: j.telegram?.slice(0, 1000) ?? null, x: j.x?.slice(0, 280) ?? null }
  } catch {
    return { telegram: null, x: null }
  }
}

async function writeDraft(telegram: string, x: string, fallback: boolean) {
  const dir = path.resolve('data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `promo-draft-${new Date().toISOString().slice(0, 10)}.md`)
  const content = `# Promo draft ${new Date().toISOString().slice(0, 10)} ${fallback ? '(fallback sin IA)' : '(IA)'}

## Telegram
${telegram}

## X
${x}

---
Generado ${new Date().toISOString()} — ${fallback ? 'Groq no disponible/timeout/precio mismatch → fallback buildTelegramMessage' : 'Groq OK'}
Para publicar manual: copia el bloque Telegram al canal t.me/pescatch y el bloque X a X.
`
  fs.writeFileSync(file, content, 'utf-8')
  console.log(`  📝 Draft ${file}`)
}

async function main() {
  const dry = !process.argv.includes('--apply')
  const force = process.argv.includes('--force') // ignora draft-only, publica aunque no haya X keys
  console.log(dry ? '\n[DRY-RUN] promo-auto 3×/semana (usa --apply para publicar)' : '\n[APPLY] promo-auto')
  await seedDatabase()
  const deals = await getTopDeals()
  if (!deals.length) {
    console.log('❌ No hay deals published con descuento para promo.')
    return
  }
  console.log(`Top ${deals.length} por comisión: ${deals.map(d => `${d.slug} ${d.commission}€`).join(', ')}`)

  const fallbackTg = buildTelegramMessage(deals.slice(0, 8) as any)
  const fallbackX = buildXText(deals)
  const ai = await buildPromoCopyAI(deals)
  const telegram = ai.telegram ?? fallbackTg
  const x = ai.x ?? fallbackX
  const usedFallback = !ai.telegram

  if (dry) {
    console.log('\n— Telegram preview —\n' + telegram.slice(0, 600))
    console.log('\n— X preview —\n' + x)
    await writeDraft(telegram, x, usedFallback)
    console.log(`\n[DRY] No se publicó. Ejecuta con --apply ${isXConfigured() ? '(X configurado → tuiteará)' : '(X no configurado → solo Telegram, X quedará en draft)'}.`)
    return
  }

  await writeDraft(telegram, x, usedFallback)

  // Telegram siempre (si configurado)
  if (isTelegramConfigured()) {
    console.log('📣 Telegram: enviando...')
    const res = await sendTelegramMessage(telegram)
    if (res.ok) {
      console.log(`  ✅ Telegram OK${res.messageId ? ` id=${res.messageId}` : ''}`)
      if (res.messageId) {
        const pin = await pinTelegramMessage(res.messageId)
        console.log(pin.ok ? '  📌 Fijado' : `  ⚠️ No fijado: ${pin.error}`)
      }
    } else console.error(`  ❌ Telegram: ${res.error}`)
  } else console.log('  ⬜ Telegram no configurado (TELEGRAM_BOT_TOKEN/CHANNEL_ID)')

  // X solo si configurado o --force (force no tuitea sin keys, solo avisa)
  if (isXConfigured()) {
    console.log('🐦 X: posteando...')
    const r = await postTweet(x)
    console.log(r.ok ? `  ✅ X id=${r.id}` : `  ❌ X: ${r.error}`)
  } else {
    console.log('  ⬜ X no configurado — draft guardado en data/promo-draft-*.md para copia manual. Añade X_API_KEY/SECRET + X_ACCESS_TOKEN/SECRET para auto-post.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
