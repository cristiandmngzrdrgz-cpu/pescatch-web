// PROPÓSITO: verificar el precio real (API productdetail.get) de los candidatos AE del
//            discover de hoy vs el precio guardado en pending_candidates. Marca CHECK
//            cuando difieren >15% (regla 06-08: el precio "desde" puede no ser el real).
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/check-ae-candidates.ts [--cand path] [--map path] [--out path]
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getProductDetails } from '../../src/lib/aliexpress-api'

const args = process.argv.slice(2)
const forArg = (name: string, def: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : def
}

const CAND = forArg('--cand', 'scripts/discover/candidatos-ae-2026-08-23.json')
const MAP = forArg('--map', 'scripts/discover/verified-ae-prices.json')
const OUT = forArg('--out', 'scripts/discover/ae-price-check-2026-08-23.json')

interface CandRow { title: string; price: number; url: string }
interface MapRow { pid: string | null; itemUrl: string; title: string; price: number }

async function main() {
  const cands: CandRow[] = JSON.parse(readFileSync(resolve(CAND), 'utf-8'))
  const map: MapRow[] = JSON.parse(readFileSync(resolve(MAP), 'utf-8'))

  // emparejar candidato -> pid por título+precio (verified se generó del mismo orden)
  const byKey = new Map<string, MapRow>()
  for (const m of map) if (m.pid) byKey.set(`${m.title}|${m.price}`, m)

  const seen = new Set<string>()
  const items: { pid: string; title: string; candPrice: number }[] = []
  for (const c of cands) {
    const m = byKey.get(`${c.title}|${c.price}`)
    if (!m?.pid) continue
    if (seen.has(m.pid)) continue // duplicados mismo producto
    seen.add(m.pid)
    items.push({ pid: m.pid, title: c.title, candPrice: c.price })
  }
  console.log(`Candidatos únicos con PID: ${items.length}`)

  const results: {
    pid: string; title: string; candPrice: number
    apiPrice: number | null; apiOriginal: number | null; diffPct: number | null; verdict: string
  }[] = []

  const BATCH = 10
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    let details: Awaited<ReturnType<typeof getProductDetails>> = []
    try {
      details = await getProductDetails(batch.map((b) => b.pid))
    } catch (e) {
      console.log(`  batch ${i / BATCH + 1} falló: ${e instanceof Error ? e.message : e}`)
    }
    const byPid = new Map(details.map((d) => [String(d.productId), d]))
    for (const b of batch) {
      const d = byPid.get(b.pid)
      const apiPrice = d && d.price > 0 ? d.price : null
      const diffPct = apiPrice ? Math.abs(apiPrice - b.candPrice) / b.candPrice * 100 : null
      results.push({
        pid: b.pid,
        title: b.title,
        candPrice: b.candPrice,
        apiPrice,
        apiOriginal: d?.originalPrice ?? null,
        diffPct: diffPct === null ? null : Math.round(diffPct * 10) / 10,
        verdict: !apiPrice ? 'SIN-DATOS-API' : diffPct > 15 ? 'CHECK' : 'OK',
      })
    }
    console.log(`  batch ${i / BATCH + 1}: ${Math.min(batch.length, BATCH)} consultados`)
    await new Promise((r) => setTimeout(r, 1500))
  }

  writeFileSync(resolve(OUT), JSON.stringify(results, null, 2))

  const ok = results.filter((r) => r.verdict === 'OK')
  const check = results.filter((r) => r.verdict === 'CHECK')
  const nodata = results.filter((r) => r.verdict === 'SIN-DATOS-API')
  console.log(`\n=== RESUMEN ===`)
  console.log(`OK (±15%): ${ok.length}`)
  console.log(`CHECK (>15% diferencia): ${check.length}`)
  console.log(`SIN-DATOS-API: ${nodata.length}`)
  if (check.length) {
    console.log('\n--- Requieren verificación manual (candidato vs API) ---')
    for (const r of check.sort((a, b) => (b.diffPct ?? 0) - (a.diffPct ?? 0))) {
      console.log(`${r.candPrice.toFixed(2)}€ -> ${r.apiPrice!.toFixed(2)}€ (${r.diffPct}%) ${r.title.slice(0, 50)}`)
    }
  }
  console.log(`\nEscrito ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
