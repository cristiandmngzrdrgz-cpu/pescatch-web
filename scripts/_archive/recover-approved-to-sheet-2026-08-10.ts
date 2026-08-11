import { config } from 'dotenv'

// PROPÓSITO: Recuperar en el Sheet los candidatos aprobados que el bug de appendRow dejó fuera
// (route.ts aprobaba pero buscaba el candidato en status='pending' y no lo encontraba => nunca añadía la fila).
// FECHA: 2026-08-10

async function main() {
  const env = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
  const { createClient } = await import('@libsql/client')
  const { readAllRows, appendRow } = await import('../src/lib/sync/google-sheets-client')
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })

  const { headers, rows } = await readAllRows()
  const nameIdx = headers.findIndex((h) => h.toLowerCase() === 'name')
  if (nameIdx < 0) { console.log('Columna name no encontrada:', headers.join(' | ')); return }
  const sheetNames = new Set(rows.map((r) => (r[nameIdx] || '').trim().toLowerCase()))

  const approved = await prod.execute({ sql: "SELECT * FROM pending_candidates WHERE status = 'approved' ORDER BY id" })
  console.log('Aprobados en Turso:', approved.rows.length)
  console.log('Headers sheet:', headers.join(' | '), '\n')

  for (const raw of approved.rows) {
    const c = raw as any
    const title = String(c.title || '').trim()
    if (!title) continue

    const inSheet = sheetNames.has(title.toLowerCase())
    if (inSheet) {
      console.log(`OK (ya en Sheet): id ${c.id} | ${title.slice(0, 50)}`)
      continue
    }

    const url = String(c.url || '')
    const lower = url.toLowerCase()
    const store = lower.includes('decathlon') ? 'decathlon' : lower.includes('aliexpress') ? 'aliexpress' : 'amazon'

    const rowData: Record<string, string | number | boolean> = {
      ean: store === 'amazon' ? String(c.ean || '').replace(/[^\d]/g, '') : String(c.ean || ''),
      name: title,
      brand: String(c.brand || ''),
      category: String(c.category || ''),
      imageUrl: String(c.imageUrl || ''),
      [`${store}Price`]: Number(c.price) || '',
      [`${store}Url`]: url,
      [`${store}Stock`]: 'in_stock',
    }
    if (store === 'amazon' && c.asin) rowData.amazonVariantAsin = String(c.asin)
    if (c.originalPrice) rowData[`${store}OriginalPrice`] = Number(c.originalPrice)

    const row = headers.map((h) => rowData[h] ?? '')
    await appendRow(row)
    sheetNames.add(title.toLowerCase())
    console.log(`AÑADIDO: id ${c.id} | ${store} | ${c.price}€ | ${title.slice(0, 50)}`)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})