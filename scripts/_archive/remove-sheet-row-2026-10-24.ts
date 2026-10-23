// PROPÓSITO: Quitar del Sheet la fila duplicada de la Daiwa Exceler (B0CSDSG7M3, 76€),
//            variante de un deal ya publicado más barato (B0CSDR4MPC, 47,99€).
// FECHA: 2026-10-24
// Uso: npx tsx scripts/remove-sheet-row-2026-10-24.ts           (dry-run)
//      npx tsx scripts/remove-sheet-row-2026-10-24.ts --apply

import 'dotenv/config'
import { readAllRows, deleteDataRows } from '../../src/lib/sync/google-sheets-client'
import { getDb, initSchema, migrateSchema } from '../../src/lib/db'

const ASIN = 'B0CSDSG7M3'
const CANDIDATE_ID = 2067

async function main() {
  const apply = process.argv.includes('--apply')
  const { headers, rows } = await readAllRows()

  const urlCols = ['amazonUrl', 'aliexpressUrl']
    .map(h => headers.indexOf(h))
    .filter(i => i >= 0)

  const matches: number[] = []
  rows.forEach((row, idx) => {
    if (urlCols.some(i => String(row[i] || '').includes(ASIN))) {
      matches.push(idx)
      console.log(`Fila ${idx + 2}: ${row[headers.indexOf('name')] || '(sin nombre)'} | ${row[urlCols[0]] || ''}`)
    }
  })

  if (matches.length === 0) {
    console.log('No hay filas con ' + ASIN + ' en el Sheet.')
  } else if (!apply) {
    console.log(`\nDRY-RUN: se borrarían ${matches.length} fila(s). Ejecuta con --apply.`)
  } else {
    await deleteDataRows(matches)
    console.log(`\n✅ Borradas ${matches.length} fila(s) del Sheet.`)
  }

  if (apply) {
    await initSchema()
    await migrateSchema()
    const db = getDb()
    await db.execute({
      sql: "UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id=?",
      args: [CANDIDATE_ID],
    })
    console.log(`✅ Candidato ${CANDIDATE_ID} marcado rejected (variante duplicada).`)
  }

  const after = await readAllRows()
  const still = after.rows.some(row => urlCols.some(i => String(row[i] || '').includes(ASIN)))
  console.log(still ? '⚠️ La fila sigue en el Sheet.' : '✅ Sheet sin la fila duplicada.')
}

main().catch(e => { console.error(e); process.exit(1) })
