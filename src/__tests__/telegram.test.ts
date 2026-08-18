import { describe, it, expect, afterEach } from 'vitest'
import { buildTelegramMessage, sendTelegramMessage, isTelegramConfigured } from '@/lib/telegram'

const deals = [
  {
    title: 'Carrete Shimano Nasci 2500',
    salePrice: 94.99,
    originalPrice: 109.99,
    discountPercent: 14,
    storeName: 'Amazon',
    slug: 'carrete-nasci-2500',
  },
  {
    title: 'Caña & Mango',
    salePrice: 30,
    originalPrice: 30,
    discountPercent: 0,
    storeName: 'AliExpress',
    slug: 'cana-mango',
  },
]

describe('buildTelegramMessage', () => {
  it('builds a message with links, prices and savings', () => {
    const msg = buildTelegramMessage(deals)
    expect(msg).toContain('<b>🎣 Chollos de pesca destacados</b>')
    expect(msg).toContain('https://www.pescatch.es/deals/carrete-nasci-2500')
    expect(msg).toContain('<b>94.99 €</b>')
    expect(msg).toContain('<s>109.99 €</s>')
    expect(msg).toContain('(-14%)')
    expect(msg).toContain('Ahorras 15.00 €')
    expect(msg).toContain('https://www.pescatch.es/search')
  })

  it('escapes html entities in titles and store names', () => {
    const msg = buildTelegramMessage(deals)
    expect(msg).toContain('Caña &amp; Mango')
    expect(msg).not.toContain('Caña & Mango')
  })

  it('omits original price and savings when there is no discount', () => {
    const msg = buildTelegramMessage([deals[1]])
    expect(msg).not.toContain('<s>')
    expect(msg).not.toContain('Ahorras')
  })

  it('returns a friendly message when there are no deals', () => {
    const msg = buildTelegramMessage([])
    expect(msg).toContain('Hoy no hay chollos destacados')
  })
})

describe('sendTelegramMessage', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHANNEL_ID
  })

  it('returns error when env vars are missing', async () => {
    const res = await sendTelegramMessage('hola')
    expect(res.ok).toBe(false)
    expect(res.error).toContain('TELEGRAM_BOT_TOKEN')
  })

  it('posts to the bot API with chat_id, html mode and returns ok', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:token'
    process.env.TELEGRAM_CHANNEL_ID = '@pescatch'
    let captured: { url: string; body: Record<string, unknown> } | null = null

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      captured = { url: String(input), body }
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch

    const res = await sendTelegramMessage('mensaje')
    expect(res.ok).toBe(true)
    expect(captured!.url).toBe('https://api.telegram.org/bot123:token/sendMessage')
    expect(captured!.body.chat_id).toBe('@pescatch')
    expect(captured!.body.text).toBe('mensaje')
    expect(captured!.body.parse_mode).toBe('HTML')
  })

  it('returns the api description on non-ok response', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:token'
    process.env.TELEGRAM_CHANNEL_ID = '@pescatch'

    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ ok: false, description: 'chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch

    const res = await sendTelegramMessage('mensaje')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('chat not found')
  })

  it('returns error message on network failure', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:token'
    process.env.TELEGRAM_CHANNEL_ID = '@pescatch'

    globalThis.fetch = (async () => {
      throw new Error('ECONNRESET')
    }) as typeof fetch

    const res = await sendTelegramMessage('mensaje')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('ECONNRESET')
  })
})

describe('isTelegramConfigured', () => {
  it('is false without env vars', () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHANNEL_ID
    expect(isTelegramConfigured()).toBe(false)
  })

  it('is true with both env vars', () => {
    process.env.TELEGRAM_BOT_TOKEN = 't'
    process.env.TELEGRAM_CHANNEL_ID = '@c'
    expect(isTelegramConfigured()).toBe(true)
  })
})