import 'dotenv/config'
import { readAllRows } from '../src/lib/sync/google-sheets-client'

async function main() {
  const { headers, rows } = await readAllRows()
  console.log('Headers:', headers)
  console.log('Total rows:', rows.length)
  if (rows.length > 0) {
    console.log('Last row:', rows[rows.length - 1])
  }
}

main().catch(console.error)
