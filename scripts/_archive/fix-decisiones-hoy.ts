// PROPÓSITO: reparar la aplicación de decisiones de hoy: parchear las 27 filas
//            añadidas al Sheet sin aliexpressUrl y marcar estados con los IDs
//            CORRECTOS de cada base (local y Turso tienen espacios de IDs distintos).
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/fix-decisiones-hoy.ts [--aprobados "..."] [--rechazados "..."]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { readAllRows, updateRowByIndex } from '../../src/lib/sync/google-sheets-client'

const args = process.argv.slice(2)
const forArg = (name: string): string[] => {
  const i = args.indexOf(name)
  if (i < 0) return []
  const out: number[] = []
  for (const part of args[i + 1].split(',')) {
    const m = part.trim().match(/^(\d+)-(\d+)$/)
    if (m) for (let n = Number(m[1]); n <= Number(m[2]); n++) out.push(n)
    else if (/^\d+$/.test(part.trim())) out.push(Number(part.trim()))
  }
  return out
}

interface Decision { n: number; id: number; pid: string | null; dup?: string; verdict?: string; price: number; orig?: number | null; title: string }

async function main() {
  const creds = process.env.GOOGLE_SHEETS_CREDENTIALS || readFileSync('.env.google-sheets.json', 'utf-8')
  process.env.GOOGLE_SHEETS_CREDENTIALS = creds

  // env de producción SOLO para el cliente explícito de Turso (nunca para getDb)
  const prodEnvRaw = readFileSync('.env.vercel', 'utf-8')
  const prodEnv: Record<string, string> = {}
  for (const line of prodEnvRaw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) prodEnv[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const turso = createClient({ url: prodEnv.TURSO_DATABASE_URL, authToken: prodEnv.TURSO_AUTH_TOKEN })
  const local = createClient({ url: 'file:data/pescatch.db' })

  const decisions: Decision[] = JSON.parse(readFileSync(resolve('scripts/discover/decisiones-hoy.json'), 'utf-8'))
  const byPos = new Map(decisions.map((d) => [d.n, d]))
  const aprobar = forArg('--aprobados')
  const rechazar = forArg('--rechazados')
  console.log(`Aprobar: ${aprobar.length} · Rechazar: ${rechazar.length}`)

  // 0. Seguridad: ¿existen en Turso los IDs locales (posible colisión del intento anterior)?
  const localIds = [...aprobar, ...rechazar].map((n) => byPos.get(n)!.id)
  const maxLocalId = Math.max(...localIds)
  const tmax = await turso.execute('SELECT MAX(id) m FROM pending_candidates')
  console.log(`Turso max(id)=${tmax.rows[0].m} vs max id local usado=${maxLocalId}`)
  if (Number(tmax.rows[0].m) >= Math.min(...localIds)) {
    console.log('⚠️ Hay solape de rangos de IDs: verificar manualmente candidatos de Turso con esos ids.')
  } else {
    console.log('✅ Sin solape: los updates previos sobre Turso fueron no-ops.')
  }
  const lmax = await local.execute('SELECT MAX(id) m FROM pending_candidates')
  console.log(`Local max(id)=${lmax.rows[0].m}`)

  // 1. Mapa posición -> fila de cada DB por (title|price), mismo orden determinista
  const q = `SELECT id, title, price, originalPrice, brand, category, imageUrl, url FROM pending_candidates WHERE source='AliExpress directo' AND created_at > '2026-08-22' ORDER BY score DESC, id ASC`
  const lr = await local.execute(q)
  const tr = await turso.execute(q)
  const keyOf = (title: unknown, price: unknown) => `${String(title)}|${Number(price).toFixed(2)}`
  const mapRows = (rows: any[]) => new Map(rows.map((r) => [keyOf(r.title, r.price), r]))
  const lm = mapRows(lr.rows as any[])
  const tm = mapRows(tr.rows as any[])

  // sanity: cada decisión debe existir en ambas bases
  for (const n of [...aprobar, ...rechazar]) {
    const d = byPos.get(n)!
    if (!lm.has(keyOf(d.title, d.price)) || !tm.has(keyOf(d.title, d.price))) {
      throw new Error(`#${n} no encontrada en una de las bases: ${d.title.slice(0, 40)}`)
    }
  }
  console.log('✅ Mapeo título|precio consistente en local y Turso')

  // 2. Estados en LOCAL (ids locales) y TURSO (ids turso)
  for (const [n, status] of [...aprobar.map((n) => [n, 'approved'] as const), ...rechazar.map((n) => [n, 'rejected'] as const)]) {
    const d = byPos.get(n)!
    const k = keyOf(d.title, d.price)
    await local.execute({ sql: `UPDATE pending_candidates SET status=?, updated_at=datetime('now') WHERE id=?`, args: [status, (lm.get(k) as any).id] })
    await turso.execute({ sql: `UPDATE pending_candidates SET status=?, updated_at=datetime('now') WHERE id=?`, args: [status, (tm.get(k) as any).id] })
  }
  console.log(`✅ Estados actualizados en local y Turso`)

  // 3. Contar pendientes restantes hoy en Turso (deben quedar solo los no decididos = 0 aquí)
  const tpend = await turso.execute(`SELECT COUNT(*) c FROM pending_candidates WHERE status='pending' AND source='AliExpress directo' AND created_at > '2026-08-22'`)
  console.log(`Pendientes de hoy aún en Turso: ${tpend.rows[0].c} (esperado 0)`)

  // 4. Parchear las filas del Sheet (buscamos desde el final las que tengan name+price y url vacía)
  const { headers, rows } = await readAllRows()
  const iName = headers.indexOf('name')
  const iPri = headers.indexOf('aliexpressPrice')
  const cols = ['aliexpressUrl', 'aliexpressOriginalPrice', 'brand', 'category', 'imageUrl', 'ean'] as const

  let patched = 0
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  async function safeUpdate(i: number, col: string, val: string | number) {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await updateRowByIndex(i, col, val)
        await sleep(1200)
        return
      } catch (e: any) {
        const status = e?.code ?? e?.response?.status
        if (status === 429 && attempt < 5) {
          console.log(`  429 en ${col} fila ${i + 2}, espero ${attempt * 20}s...`)
          await sleep(attempt * 20000)
          continue
        }
        throw e
      }
    }
  }
  const aprobSet = new Set(aprobar)
  // recorrer desde el final, emparejando por nombre+precio con las decisiones aprobadas ya usadas
  const pendientes = new Map<number, Decision>()
  for (const n of aprobar) pendientes.set(n, byPos.get(n)!)
  for (let i = rows.length - 1; i >= 0 && pendientes.size > 0; i--) {
    const r = rows[i] as any[]
    const name = String(r[iName] ?? '')
    const priceStr = String(r[iPri] ?? '').replace(',', '.')
    const price = Number(priceStr)
    if (!name || !Number.isFinite(price)) continue
    // buscar decisión aprobada cuyo título coincida (prefijo suficiente) y precio ±0.01
    let hit: { n: number; d: Decision } | null = null
    for (const [n, d] of pendientes) {
      if (Math.abs(price - d.price) < 0.011 && (name === d.title || d.title.startsWith(name.slice(0, 30)))) {
        hit = { n, d }
        break
      }
    }
    if (!hit) continue
    const d = hit.d
    const k = keyOf(d.title, d.price)
    const src = tm.get(k) as any
    const vals: Record<string, string | number> = {
      aliexpressUrl: src.url ?? '',
      aliexpressOriginalPrice: src.originalPrice != null && src.originalPrice !== '' ? Number(src.originalPrice) : '',
      brand: src.brand ?? '',
      category: src.category ?? '',
      imageUrl: src.imageUrl ?? '',
      ean: src.ean ?? '',
    }
    for (const col of cols) {
      const ci = headers.indexOf(col)
      if (ci >= 0 && (r[ci] == null || r[ci] === '')) {
        await safeUpdate(i, col, vals[col])
      }
    }
    pendientes.delete(hit.n)
    patched++
    console.log(`Fila ${i + 2}: ${name.slice(0, 45)} -> url=${String(vals.aliexpressUrl).slice(0, 45)}`)
  }
  console.log(`\nParcheadas ${patched}/${aprobar.length}. Sin emparejar: ${[...pendientes.keys()].join(',') || 'ninguna'}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
