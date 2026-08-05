import 'dotenv/config'
import { refreshAllPrices } from '../src/lib/price-scraper/refresh-all'
import { migrateSchema } from '../src/lib/db'
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const removedFile = path.resolve(process.cwd(), 'data', 'removed-deals.json')
const node = process.execPath
const tsxCli = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs')

function loadRemovedIds(): string[] {
  if (!fs.existsSync(removedFile)) return []
  try {
    return JSON.parse(fs.readFileSync(removedFile, 'utf8')) as string[]
  } catch {
    return []
  }
}

function runPush(apply: boolean): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [tsxCli, 'scripts/push-prices-to-prod.ts']
    if (apply) args.push('--apply')

    const child = spawn(node, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })

    child.on('exit', code => (code === 0 ? resolve(0) : reject(new Error(`push-prices-to-prod exited with code ${code}`))))
    child.on('error', reject)
  })
}

async function main() {
  const apply = process.argv.includes('--apply')

  console.log('=== 1/2 REFRESH DE PRECIOS (local) ===\n')
  await migrateSchema()
  const result = await refreshAllPrices()

  console.log(`\n✅ Refresh: ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed, ${result.removed} removed`)
  if (result.alerts > 0) {
    console.log(`⚠ ${result.alerts} deals flagged with priceAlert (large price change)`)
  }

  const pending = loadRemovedIds()
  if (result.removedIds.length > 0 || pending.length > 0) {
    const merged = [...new Set([...pending, ...result.removedIds])]
    fs.writeFileSync(removedFile, JSON.stringify(merged, null, 2))
    console.log(`📝 ${merged.length} deals pendientes de eliminar en producción (data/removed-deals.json)`)
  }

  console.log('\n=== 2/2 PROPAGAR A PRODUCCIÓN (Turso) ===')
  await runPush(apply)

  console.log(`\n✅ Workflow completo. Ejecuta con --apply para escribir en Turso (por defecto es dry-run).`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
