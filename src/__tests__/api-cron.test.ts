import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema, getDb } from '@/lib/db'

process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret'

vi.mock('@/lib/price-scraper/index', () => ({
  scrapeStore: vi.fn(),
  updateDealInDb: vi.fn(),
}))

vi.mock('@/lib/telegram', () => ({
  isTelegramConfigured: () => true,
  buildTelegramMessage: (deals: Array<{ title: string }>) =>
    'MSG:' + deals.map((d) => d.title).join('|'),
  sendTelegramMessage: vi.fn(async (message: string) => ({ ok: true, mockedMessage: message })),
}))

vi.mock('@/lib/email', () => ({
  isEmailConfigured: () => true,
  sendAdminNotification: vi.fn(async () => true),
  sendEmail: vi.fn(async () => true),
  buildNewsletterHtml: (deals: Array<{ title: string }>) =>
    '<div>' + deals.map((d) => d.title).join('|') + '</div>',
  buildPriceAlertHtml: vi.fn(() => '<div>alert</div>'),
  buildAdminNotificationHtml: vi.fn(() => '<div>admin</div>'),
}))

const { scrapeStore, updateDealInDb } = await import('@/lib/price-scraper/index')
const { sendEmail } = await import('@/lib/email')
const { sendTelegramMessage } = await import('@/lib/telegram')

// Imports estáticos: vite no resuelve import() con ruta en variable.
const cronRoutes = {
  sync: () => import('@/app/api/cron/sync/route'),
  'refresh-prices': () => import('@/app/api/cron/refresh-prices/route'),
  'clean-expired': () => import('@/app/api/cron/clean-expired/route'),
  'price-alerts': () => import('@/app/api/cron/price-alerts/route'),
  newsletter: () => import('@/app/api/cron/newsletter/route'),
  telegram: () => import('@/app/api/cron/telegram/route'),
}

type CronRoute = keyof typeof cronRoutes

beforeAll(async () => {
  await initSchema()
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(updateDealInDb).mockResolvedValue('updated')
})

function cronRequest(path: string, method: 'GET' | 'POST' = 'GET', auth = true): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: auth ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {},
  })
}

async function seedDeal(overrides: Record<string, unknown> = {}) {
  const { createDeal } = await import('@/data/queries')
  const n = Math.random().toString(36).slice(2, 10)
  const deal = await createDeal({
    title: `Deal ${n}`,
    slug: `deal-${n}`,
    productId: `prod-${n}`,
    originalPrice: 100,
    salePrice: 50,
    storeId: 'amazon',
    storeName: 'Amazon',
    category: 'accesorios',
    status: 'published',
    affiliateUrl: 'https://www.amazon.es/dp/B0TEST123',
    ...overrides,
  })
  // createDeal persiste expiresAt como '' cuando no se pasa; el refresh solo
  // considera deals con expiresAt NULL o futuro → normalizamos a NULL salvo que
  // el test pase uno explícito (p. ej. fecha pasada para clean-expired).
  if (overrides.expiresAt === undefined) {
    const db = getDb()
    await db.execute({ sql: `UPDATE deals SET expiresAt = NULL WHERE id = ?`, args: [deal.id] })
  }
  return deal
}

async function getCursor(): Promise<string> {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT value FROM cron_state WHERE key = 'refresh_prices_cursor'` })
  return (r.rows[0]?.value as string) ?? ''
}

async function eligibleCount(): Promise<number> {
  const db = getDb()
  const r = await db.execute(
    `SELECT COUNT(*) as n FROM deals
     WHERE status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))
       AND affiliateUrl != '' AND storeId != 'decathlon'`
  )
  return Number(r.rows[0].n)
}

describe('cron auth', () => {
  it.each(Object.keys(cronRoutes))('GET /api/cron/%s sin token → 401', async (route) => {
    const mod = await cronRoutes[route as CronRoute]()
    const res = await mod.GET(cronRequest(`/api/cron/${route}`, 'GET', false))
    expect(res.status).toBe(401)
  })

  it.each(['sync', 'newsletter', 'telegram'] as CronRoute[])('POST /api/cron/%s con token inválido → 401', async (route) => {
    const mod = await cronRoutes[route]()
    const req = new NextRequest(`http://localhost/api/cron/${route}`, {
      method: 'POST',
      headers: { authorization: 'Bearer token-malo' },
    })
    const res = await mod.POST(req)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/cron/refresh-prices (chunked)', () => {
  beforeEach(async () => {
    const db = getDb()
    await db.execute(`DELETE FROM cron_state`)
  })

  function okPrice(url: string) {
    return { success: true, storeId: 'amazon', price: { price: 40, stock: 'in_stock' as const, url } }
  }

  it('procesa solo el chunk y persiste el cursor', async () => {
    await seedDeal()
    await seedDeal()
    expect(await eligibleCount()).toBeGreaterThanOrEqual(2)
    vi.mocked(scrapeStore).mockImplementation(async (url: string) => okPrice(url))

    const { GET } = await cronRoutes['refresh-prices']()
    const res = await GET(cronRequest('/api/cron/refresh-prices?limit=2'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.chunk).toBe(2)
    expect(body.updated).toBe(2)
    expect(await getCursor()).not.toBe('')
  })

  it('al agotar el ciclo resetea el cursor para empezar de nuevo', async () => {
    // limit mayor que el nº de deals elegibles → chunk incompleto → fin de ciclo.
    const total = await eligibleCount()
    await seedDeal()
    vi.mocked(scrapeStore).mockImplementation(async (url: string) => okPrice(url))

    const { GET } = await cronRoutes['refresh-prices']()
    const res = await GET(cronRequest(`/api/cron/refresh-prices?limit=${total + 1}`))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.updated).toBe(total + 1)
    expect(await getCursor()).toBe('')
  })

  it('limit=all lanza el ciclo completo sin tocar el cursor', async () => {
    const total = await eligibleCount()
    await seedDeal()
    vi.mocked(scrapeStore).mockImplementation(async (url: string) => okPrice(url))

    const { GET } = await cronRoutes['refresh-prices']()
    const res = await GET(cronRequest('/api/cron/refresh-prices?limit=all'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.chunk).toBe('full')
    expect(body.updated).toBe(total + 1)
    expect(await getCursor()).toBe('')
  })

  it('borra deals no disponibles y los devuelve en removedIds', async () => {
    const deal = await seedDeal()
    vi.mocked(scrapeStore).mockResolvedValue({
      success: true,
      storeId: 'amazon',
      price: { price: 0, stock: 'out_of_stock', url: deal.affiliateUrl, notAvailable: true },
    })

    const { GET } = await cronRoutes['refresh-prices']()
    const res = await GET(cronRequest('/api/cron/refresh-prices?limit=all'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.removedIds).toContain(deal.id)

    const { getDealById } = await import('@/data/queries')
    expect(await getDealById(deal.id)).toBeUndefined()
  })
})

describe('GET /api/cron/newsletter', () => {
  it('excluye tiendas deshabilitadas del top chollos', async () => {
    const db = getDb()
    await db.execute({ sql: `INSERT INTO subscribers (email) VALUES ('sub@test.com')` })

    // -90% y -95% para que el Amazon gane al seed baseline y el Decathlon
    // (si no estuviera filtrado) saldría el primero en el top por descuento.
    await seedDeal({ title: 'Chollo Amazon Newsletter', originalPrice: 1000, salePrice: 100 })
    await seedDeal({ title: 'Chollo Decathlon Newsletter', storeId: 'decathlon', storeName: 'Decathlon', originalPrice: 200, salePrice: 10 })

    const { GET } = await cronRoutes.newsletter()
    const res = await GET(cronRequest('/api/cron/newsletter'))
    expect(res.status).toBe(200)

    const html = vi.mocked(sendEmail).mock.calls[0]?.[2] as string
    expect(html).toContain('Chollo Amazon Newsletter')
    expect(html).not.toContain('Chollo Decathlon Newsletter')
  })
})

describe('GET /api/cron/telegram', () => {
  it('excluye tiendas deshabilitadas aunque tengan más descuento', async () => {
    await seedDeal({ title: 'Chollo Amazon Telegram', originalPrice: 1000, salePrice: 100 }) // -90%
    await seedDeal({ title: 'Chollo Decathlon Telegram', storeId: 'decathlon', storeName: 'Decathlon', originalPrice: 200, salePrice: 10 }) // -95%

    const { GET } = await cronRoutes.telegram()
    const res = await GET(cronRequest('/api/cron/telegram'))
    expect(res.status).toBe(200)

    const message = vi.mocked(sendTelegramMessage).mock.calls[0]?.[0] as string
    expect(message).toContain('Chollo Amazon Telegram')
    expect(message).not.toContain('Chollo Decathlon Telegram')
  })
})

describe('GET /api/cron/clean-expired', () => {
  it('marca como draft los deals expirados', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().replace('T', ' ').slice(0, 19)
    const deal = await seedDeal({ title: 'Deal Expirado Clean', expiresAt: yesterday })

    const { GET } = await cronRoutes['clean-expired']()
    const res = await GET(cronRequest('/api/cron/clean-expired'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.count).toBeGreaterThanOrEqual(1)
    expect(body.deals.map((d: { id: string }) => d.id)).toContain(deal.id)

    const { getDealById } = await import('@/data/queries')
    expect((await getDealById(deal.id))!.status).toBe('draft')
  })
})

describe('GET /api/cron/price-alerts', () => {
  it('responde 200 sin alertas activas', async () => {
    const { GET } = await cronRoutes['price-alerts']()
    const res = await GET(cronRequest('/api/cron/price-alerts'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
