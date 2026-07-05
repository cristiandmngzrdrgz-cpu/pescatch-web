import { scrapeAmazonDetails } from './amazon'

async function main() {
  console.log('Buscando detalles del producto B00FZ08FW0...')
  const details = await scrapeAmazonDetails('B00FZ08FW0')
  console.log(JSON.stringify(details, null, 2))
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
