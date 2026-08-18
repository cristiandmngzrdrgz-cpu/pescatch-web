const BASE_URL = 'https://www.pescatch.es'
const TELEGRAM_API = 'https://api.telegram.org'

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID)
}

export interface TelegramDeal {
  title: string
  salePrice: number
  originalPrice: number
  discountPercent: number
  storeName: string
  slug: string
}

// <b>, <i>, <a href="..."> y <code> son los únicos tags HTML permitidos por la Bot API.
export function buildTelegramMessage(deals: TelegramDeal[]): string {
  if (deals.length === 0) {
    return '<b>🎣 PesCatch</b>\nHoy no hay chollos destacados. Vuelve pronto.'
  }

  const lines = deals.map((d, i) => {
    const savings = d.originalPrice - d.salePrice
    return [
      `${i + 1}. <a href="${BASE_URL}/deals/${d.slug}">${escapeTelegram(d.title)}</a>`,
      `   💰 <b>${formatPrice(d.salePrice)}</b>${d.originalPrice > d.salePrice ? ` <s>${formatPrice(d.originalPrice)}</s> (-${d.discountPercent}%)` : ''}`,
      `   🏬 ${escapeTelegram(d.storeName)}${savings > 0 ? ` · Ahorras ${formatPrice(savings)}` : ''}`,
    ].join('\n')
  })

  return `<b>🎣 Chollos de pesca destacados</b>\n\n${lines.join('\n\n')}\n\n<a href="${BASE_URL}/search">Ver todos los chollos →</a>`
}

function formatPrice(n: number): string {
  return `${n.toFixed(2)} €`
}

function escapeTelegram(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegramMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channel = process.env.TELEGRAM_CHANNEL_ID

  if (!token || !channel) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL_ID son obligatorios' }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    })

    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}