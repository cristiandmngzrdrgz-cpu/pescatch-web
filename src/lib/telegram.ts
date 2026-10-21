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

export interface TelegramMessageOptions {
  heading?: string
}

// <b>, <i>, <a href="..."> y <code> son los únicos tags HTML permitidos por la Bot API.
export function buildTelegramMessage(
  deals: TelegramDeal[],
  options: TelegramMessageOptions = {},
): string {
  const heading = options.heading || '🎣 Chollos de pesca destacados'

  if (deals.length === 0) {
    return `<b>${escapeTelegram(heading)}</b>\nHoy no hay chollos destacados. Vuelve pronto.`
  }

  const lines = deals.map((d, i) => {
    const pct = realDiscountPercent(d)
    const savings = d.originalPrice - d.salePrice
    const hasDiscount = pct > 0 && savings > 0

    return [
      `${i + 1}. <a href="${BASE_URL}/deals/${d.slug}">${escapeTelegram(d.title)}</a>`,
      `   💰 <b>${formatPrice(d.salePrice)}</b>${hasDiscount ? ` <s>${formatPrice(d.originalPrice)}</s> (-${pct}%)` : ''}`,
      `   🏬 ${escapeTelegram(d.storeName)}${hasDiscount ? ` · Ahorras ${formatPrice(savings)}` : ''}`,
    ].join('\n')
  })

  return `<b>${escapeTelegram(heading)}</b>\n\n${lines.join('\n\n')}\n\n⚡ <a href="${BASE_URL}/top-chollos">Top chollos — descuentos y popularidad</a> · <a href="${BASE_URL}/search">Ver todos →</a>`
}

// Cabecera con fecha en español (zona horaria de la web).
export function telegramDateHeading(prefix: string, date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Madrid',
  }).format(date)
  return `${prefix} · ${formatted}`
}

// El descuento se calcula desde los precios: discountPercent puede venir
// inflado por la API de AliExpress o desincronizado tras un refresh.
function realDiscountPercent(d: TelegramDeal): number {
  if (!(d.originalPrice > d.salePrice) || d.originalPrice <= 0) return 0
  return Math.round((1 - d.salePrice / d.originalPrice) * 100)
}

function formatPrice(n: number): string {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} €`
}

function escapeTelegram(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegramMessage(text: string): Promise<{ ok: boolean; error?: string; messageId?: number }> {
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

    const data = (await res.json()) as { ok: boolean; description?: string; result?: { message_id: number } }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` }
    }
    return { ok: true, messageId: data.result?.message_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Corrige un mensaje ya publicado (p. ej. un digest fijado con precios obsoletos)
// sin borrarlo ni perder el pin.
export async function editTelegramMessage(messageId: number, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channel = process.env.TELEGRAM_CHANNEL_ID
  if (!token || !channel) return { ok: false, error: 'Telegram no configurado' }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel,
        message_id: messageId,
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

export async function pinTelegramMessage(messageId: number): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channel = process.env.TELEGRAM_CHANNEL_ID
  if (!token || !channel) return { ok: false, error: 'Telegram no configurado' }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channel, message_id: messageId, disable_notification: true }),
    })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!res.ok || !data.ok) return { ok: false, error: data.description || `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function unpinTelegramMessage(messageId: number): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channel = process.env.TELEGRAM_CHANNEL_ID
  if (!token || !channel) return { ok: false, error: 'Telegram no configurado' }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/unpinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channel, message_id: messageId }),
    })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!res.ok || !data.ok) return { ok: false, error: data.description || `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
