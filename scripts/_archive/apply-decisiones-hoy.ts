// PROPÓSITO: aplicar decisiones de aprobación/rechazo sobre candidatos AE del día,
//            replicando el flujo del panel /admin/candidates: marca estado en DB local,
//            añade fila al Google Sheet (aprobados) y sincroniza el estado en Turso.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/apply-decisiones-hoy.ts [--aprobados "1,3,5-8"] [--rechazados "2,4"]
import 'dotenv/config'
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { getCandidateById, approveCandidate, rejectCandidate } from '../../src/lib/pending-candidates'
import { readAllRows, appendRow } from '../../src/lib/sync/google-sheets-client'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const args = process.argv.slice(2)
const forArg = (name: string): string[] => {
  const i = args.indexOf(name)
  if (i < 0) return []
  return parseRanges(args[i + 1])
}
function parseRanges(spec: string): number[] {
  const out: number[] = []
  for (const part of spec.split(',')) {
    const m = part.trim().match(/^(\d+)-(\d+)$/)
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i++) out.push(i)
    else if (/^\d+$/.test(part.trim())) out.push(Number(part.trim()))
  }
  return out
}

interface Decision { n: number; id: number; pid: string | null; title: string; price: number }

async function main() {
  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    process.env.GOOGLE_SHEETS_CREDENTIALS = readFileSync('.env.google-sheets.json', 'utf-8')
  }
  loadProdEnv()
  const decisions: Decision[] = JSON.parse(
    readFileSync(resolve('scripts/discover/decisiones-hoy.json'), 'utf-8'),
  )
  const byPos = new Map(decisions.map((d) => [d.n, d]))

  const aprobar = forArg('--aprobados').filter((n) => byPos.has(n))
  const rechazar = forArg('--rechazados').filter((n) => byPos.has(n))
  console.log(`Aprobar: ${aprobar.length} · Rechazar: ${rechazar.length}`)

  const prod = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const { headers } = await readAllRows()
  let okSheet = 0
  let failSheet = 0

  for (const n of rechazar) {
    const d = byPos.get(n)!
    const okLocal = await rejectCandidate(d.id)
    await prod.execute({
      sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id = ?`,
      args: [d.id],
    })
    console.log(`#${n} RECHAZADO${okLocal ? '' : ' (id no encontrado en local)'}`)
  }

  for (const n of aprobar) {
    const d = byPos.get(n)!
    const cand = await getCandidateById(d.id)
    const okLocal = await approveCandidate(d.id)

    try {
      const rowData: Record<string, string | number | boolean> = {
        ean: cand?.ean ?? '',
        name: d.title,
        brand: (cand as any)?.brand || '',
        category: (cand as any)?.category || '',
        imageUrl: (cand as any)?.imageUrl || '',
        aliexpressPrice: d.price,
        aliexpressUrl: (cand as any)?.url || '',
        aliexpressStock: 'in_stock',
      }
      if ((cand as any)?.originalPrice) {
        rowData.aliexpressOriginalPrice = (cand as any).originalPrice
      }
      await appendRow(headers.map((h) => rowData[h] ?? ''))
      okSheet++
      console.log(`#${n} APROBADO -> Sheet (${d.title.slice(0, 50)}...)`)
    } catch (err) {
      failSheet++
      console.log(`#${n} aprobado en DB pero FALLO Sheet: ${err instanceof Error ? err.message : err}`)
    }

    await prod.execute({
      sql: `UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id = ?`,
      args: [d.id],
    })
    if (!okLocal) console.log(`  ⚠️ id ${d.id} no estaba en la DB local`)
  }

  console.log(`\nResumen: ${okSheet} filas añadidas al Sheet${failSheet ? `, ${failSheet} fallos` : ''}.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
