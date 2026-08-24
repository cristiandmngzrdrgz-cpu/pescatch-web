import { readAllRows } from '../../src/lib/sync/google-sheets-client'

async function main() {
  const { headers, rows } = await readAllRows()
  const i = 171 // fila de hoja 173
  console.log('fila hoja 173 completa:')
  headers.forEach((h, ci) => {
    const v = (rows[i] as unknown[])[ci]
    if (v !== undefined && String(v).trim() !== '') console.log(`  ${h}: ${String(v).slice(0, 90)}`)
  })
}
main().catch((e) => { console.error(e); process.exit(1) })
