import 'dotenv/config'
import { config } from 'dotenv'
import { runSync, insertSyncLog } from '../src/lib/run-sync'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadProdEnv()

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

async function main() {
  const target = process.env.TURSO_DATABASE_URL ? 'TURSO (produccion)' : 'LOCAL (data/pescatch.db)'
  console.log(`DB destino: ${target}`)
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('  Aviso: TURSO_DATABASE_URL no definido. Carga .env.vercel (vercel env pull).')
  }

  const skipEnrich = hasFlag('--no-enrich')
  const result = await runSync({ skipEnrich })

  console.log(`\nSync completado en ${result.durationMs}ms:`)
  console.log(`  ${result.rowsProcessed} filas procesadas`)
  console.log(`  ${result.created} creados`)
  console.log(`  ${result.updated} actualizados`)
  console.log(`  ${result.skipped} omitidos`)
  if (result.hiddenOrphans > 0) {
    console.log(`  ${result.hiddenOrphans} deals ocultados (huérfanos)`)
  }

  if (result.errors.length > 0) {
    console.log(`\n${result.errors.length} errores:`)
    for (const e of result.errors) console.log(`  x ${e}`)
  }

  await insertSyncLog({
    duration_ms: result.durationMs,
    rows_processed: result.rowsProcessed,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    hidden_orphans: result.hiddenOrphans,
    errors: result.errors,
  })
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
