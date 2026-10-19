import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/lib/db'
import { markTelegramDealsSent, selectTelegramDeals } from '@/lib/telegram-selection'

let seq = 0

interface DealInput {
  title?: string
  salePrice?: number
  originalPrice?: number
  storeId?: string
  storeName?: string
  commission?: number
  createdAt?: string
  status?: string
  stockStatus?: string
}

async function insertDeal(overrides: DealInput = {}): Promise<string> {
  const db = getDb()
  seq += 1
  const id = `deal_tg_${seq}`
  const createdAt = overrides.createdAt ?? new Date().toISOString()
  const storeId = overrides.storeId ?? 'amazon'
  const storeName = overrides.storeName ?? (storeId === 'aliexpress' ? 'AliExpress' : 'Amazon')

  await db.execute({
    sql: `INSERT INTO deals (
      id, productId, title, slug, originalPrice, salePrice,
      storeId, storeName, status, commission, createdAt, updatedAt,
      stockStatus, affiliateUrl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      `prod_tg_${seq}`,
      overrides.title ?? `Deal ${seq}`,
      `deal-tg-${seq}`,
      overrides.originalPrice ?? 100,
      overrides.salePrice ?? 50,
      storeId,
      storeName,
      overrides.status ?? 'published',
      overrides.commission ?? 0,
      createdAt,
      createdAt,
      overrides.stockStatus ?? 'in_stock',
      'https://example.com/deal',
    ],
  })

  return id
}

beforeEach(async () => {
  const db = getDb()
  await db.execute('DELETE FROM telegram_sent_deals')
  await db.execute('DELETE FROM deals')
})

describe('selectTelegramDeals', () => {
  it('incluye deals sin descuento real (0%)', async () => {
    for (let i = 0; i < 8; i++) {
      await insertDeal({ salePrice: 50, originalPrice: 50, commission: i + 1 })
    }

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked).toHaveLength(8)
  })

  it('excluye los deals enviados en los últimos 21 días', async () => {
    const sent = await insertDeal({ title: 'Ya enviado', commission: 100 })
    await markTelegramDealsSent([{ id: sent }], 'digest')

    for (let i = 0; i < 8; i++) await insertDeal({ commission: i })

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked.map(d => d.id)).not.toContain(sent)
    expect(picked).toHaveLength(8)
  })

  it('vuelve a incluir un deal cuando pasan más de 21 días', async () => {
    const old = await insertDeal({ title: 'Enviado hace 22 días' })
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO telegram_sent_deals (dealId, sentAt, mode)
            VALUES (?, datetime('now', '-22 days'), 'digest')`,
      args: [old],
    })

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked.map(d => d.id)).toContain(old)
  })

  it('en novedades solo entran deals de los últimos 7 días', async () => {
    const oldDate = new Date(Date.now() - 30 * 86400000).toISOString()
    const old = await insertDeal({ title: 'Antiguo', createdAt: oldDate, commission: 100 })

    const recent: string[] = []
    for (let i = 0; i < 8; i++) {
      recent.push(await insertDeal({ title: `Nuevo ${i}`, commission: i }))
    }

    const picked = await selectTelegramDeals({ mode: 'fresh', limit: 8 })
    expect(picked).toHaveLength(8)
    expect(picked.map(d => d.id)).not.toContain(old)
    expect(picked.map(d => d.id)).toContain(recent[7])
  })

  it('garantiza Amazon y AliExpress cuando hay candidatos', async () => {
    for (let i = 0; i < 8; i++) {
      await insertDeal({ storeId: 'amazon', storeName: 'Amazon', commission: 10 + i })
    }
    await insertDeal({ storeId: 'aliexpress', storeName: 'AliExpress', commission: 0 })

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked).toHaveLength(8)
    expect(picked.some(d => d.storeId === 'amazon')).toBe(true)
    expect(picked.some(d => d.storeId === 'aliexpress')).toBe(true)
  })

  it('devuelve menos de 8 si no hay más deals disponibles', async () => {
    for (let i = 0; i < 3; i++) await insertDeal({ commission: i })

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked).toHaveLength(3)
  })

  it('excluye agotados y tiendas deshabilitadas', async () => {
    await insertDeal({ title: 'Agotado', stockStatus: 'out_of_stock', commission: 100 })
    await insertDeal({ title: 'Decathlon', storeId: 'decathlon', storeName: 'Decathlon', commission: 100 })
    const ok = await insertDeal({ title: 'OK', commission: 1 })

    const picked = await selectTelegramDeals({ mode: 'digest', limit: 8 })
    expect(picked.map(d => d.id)).toEqual([ok])
  })
})

describe('markTelegramDealsSent', () => {
  it('guarda el deal y el modo en la tabla de rotación', async () => {
    const id = await insertDeal()

    await markTelegramDealsSent([{ id }], 'digest')

    const db = getDb()
    const row = await db.execute({
      sql: 'SELECT dealId, mode FROM telegram_sent_deals WHERE dealId = ?',
      args: [id],
    })
    expect(row.rows[0]?.dealId).toBe(id)
    expect(row.rows[0]?.mode).toBe('digest')
  })
})
