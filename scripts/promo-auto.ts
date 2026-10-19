// PROPÓSITO: Promo 3×/semana — lunes/viernes solo X, miércoles Telegram (novedades) + X
// FECHA: 2026-10-19 — rotación de 21 días y selección compartida con el cron
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { seedDatabase } from '../src/lib/seed'
import {
  buildTelegramMessage,
  isTelegramConfigured,
  sendTelegramMessage,
  telegramDateHeading,
} from '../src/lib/telegram'
import { buildXText, isXConfigured, postTweet } from '../src/lib/x-client'
import { callGroq } from '../src/lib/ai-providers/groq'
import {
  markTelegramDealsSent,
  selectTelegramDeals,
  type TelegramDealCandidate,
} from '../src/lib/telegram-selection'

const BASE_URL = 'https://www.pescatch.es'

function includesPrice(text: string, price: number): boolean {
  const compact = text.replace(/\s/g, '')
  const fixed = price.toFixed(2)
  return compact.includes(fixed) || compact.includes(fixed.replace('.', ','))
}

async function buildPromoCopyAI(
  deals: TelegramDealCandidate[],
  includeTelegram: boolean,
): Promise<{ telegram: string | null; x: string | null }> {
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
    { temperature: 0.7, maxTokens: 2000, reasoningEffort: 'low' }
  )
  if (!raw) return { telegram: null, x: null }

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    const j = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned)

    const telegram = typeof j.telegram === 'string' ? j.telegram.trim() : ''
    const x = typeof j.x === 'string' ? j.x.trim() : ''
    const telegramOk =
      !includeTelegram ||
      (telegram.length > 0 && telegram.includes('/deals/') && deals.some(d => includesPrice(telegram, d.salePrice)))
    const xOk = x.length > 0 && deals.some(d => includesPrice(x, d.salePrice))

    if (!telegramOk || !xOk) return { telegram: null, x: null }
    return {
      telegram: includeTelegram ? telegram.slice(0, 1000) : null,
      x: x.slice(0, 280),
    }
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
${telegram || '(hoy solo X)'}

## X
${x}

---
Generado ${new Date().toISOString()} — ${fallback ? 'Groq no disponible/timeout/precio mismatch → fallback' : 'Groq OK'}
Para publicar manual: copia el bloque Telegram al canal t.me/pescatch y el bloque X a X.
`
  fs.writeFileSync(file, content, 'utf-8')
  console.log(`  📝 Draft ${file}`)
}

async function main() {
  const dry = !process.argv.includes('--apply')
  const forceTelegram = process.argv.includes('--telegram')
  const sendTelegram = new Date().getUTCDay() === 3 || forceTelegram

  console.log(dry ? '\n[DRY-RUN] promo-auto (usa --apply para publicar)' : '\n[APPLY] promo-auto')
  console.log(sendTelegram ? '  Canal: Telegram (novedades) + X' : '  Canal: solo X (el digest va el lunes)')

  await seedDatabase()
  const deals = await selectTelegramDeals({ mode: sendTelegram ? 'fresh' : 'digest', limit: 8 })
  if (!deals.length) {
    console.log('❌ No hay deals published para promo.')
    return
  }
  console.log(`Seleccionados ${deals.length}: ${deals.map(d => `${d.slug} ${d.commission}€`).join(', ')}`)

  const fallbackTg = sendTelegram
    ? buildTelegramMessage(deals, { heading: telegramDateHeading('🆕 Novedades de pesca') })
    : ''
  const fallbackX = buildXText(deals)
  const ai = await buildPromoCopyAI(deals, sendTelegram)
  const telegram = sendTelegram ? (ai.telegram ?? fallbackTg) : ''
  const x = ai.x ?? fallbackX
  const usedFallback = sendTelegram ? !ai.telegram : !ai.x

  if (dry) {
    if (sendTelegram) console.log('\n— Telegram preview —\n' + telegram.slice(0, 600))
    console.log('\n— X preview —\n' + x)
    await writeDraft(telegram, x, usedFallback)
    console.log(`\n[DRY] No se publicó. Ejecuta con --apply ${isXConfigured() ? '(X configurado → tuiteará)' : '(X no configurado → X quedará en draft)'}.`)
    return
  }

  await writeDraft(telegram, x, usedFallback)

  if (sendTelegram && isTelegramConfigured()) {
    console.log('📣 Telegram: enviando...')
    const res = await sendTelegramMessage(telegram)
    if (res.ok) {
      await markTelegramDealsSent(deals, 'fresh')
      console.log(`  ✅ Telegram OK${res.messageId ? ` id=${res.messageId}` : ''}`)
    } else console.error(`  ❌ Telegram: ${res.error}`)
  } else if (sendTelegram) {
    console.log('  ⬜ Telegram no configurado (TELEGRAM_BOT_TOKEN/CHANNEL_ID)')
  }

  if (isXConfigured()) {
    console.log('🐦 X: posteando...')
    const r = await postTweet(x)
    console.log(r.ok ? `  ✅ X id=${r.id}` : `  ❌ X: ${r.error}`)
  } else {
    console.log('  ⬜ X no configurado — draft guardado en data/promo-draft-*.md para copia manual.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
