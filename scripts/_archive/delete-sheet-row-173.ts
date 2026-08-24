// PROPÓSITO: eliminar la fila 173 del Sheet (solo contiene una decathlonUrl suelta,
//            sin nombre ni precios; genera warnings en cada sync).
// FECHA: 2026-08-23
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { readAllRows, deleteDataRows } from '../../src/lib/sync/google-sheets-client'

async function main() {
  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    process.env.GOOGLE_SHEETS_CREDENTIALS = readFileSync('.env.google-sheets.json', 'utf-8')
  }
  const { rows } = await readAllRows()
  const i = 171 // fila de hoja 173
  const r = rows[i] as unknown[]
  if (!r || String(r[1] ?? '').trim() !== '') {
    console.log('ABORT: la fila 173 ya no está vacía de nombre. Contenido:', JSON.stringify(r?.slice(0, 4)))
    return
  }
  await deleteDataRows([i])
  console.log('✅ Fila 173 eliminada')
}
main().catch((e) => { console.error(e); process.exit(1) })
