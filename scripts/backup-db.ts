import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

const SOURCE = path.resolve('data', 'pescatch.db')
const BACKUP_DIR = path.resolve('data', 'backups')

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('No se encontró la DB local:', SOURCE)
    process.exit(1)
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const date = new Date().toISOString().slice(0, 10)
  const dest = path.join(BACKUP_DIR, `pescatch-${date}.db`)

  fs.copyFileSync(SOURCE, dest)
  console.log(`Backup creado: ${dest}`)
}

main()