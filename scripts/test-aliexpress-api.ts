// PROPÓSITO: Validar la integración con la API de AliExpress (firma TOP + productdetail + product.query)
// FECHA: 2026-08-06
import 'dotenv/config'
import {
  signRequest,
  getProductDetails,
  searchProducts,
  parseProductIdFromUrl,
  callAliExpressApi,
} from '../src/lib/aliexpress-api'

async function main() {
  console.log('=== Test AliExpress API ===')
  console.log('Endpoint:', process.env.ALIEXPRESS_API_ENDPOINT || 'https://api-sg.aliexpress.com/sync')
  console.log('AppKey set:', Boolean(process.env.ALIEXPRESS_APP_KEY))
  console.log('AppSecret set:', Boolean(process.env.ALIEXPRESS_APP_SECRET))
  console.log('TrackingId set:', Boolean(process.env.ALIEXPRESS_TRACKING_ID))

  if (!process.env.ALIEXPRESS_APP_KEY || !process.env.ALIEXPRESS_APP_SECRET) {
    console.error('❌ Falta ALIEXPRESS_APP_KEY o ALIEXPRESS_APP_SECRET en .env')
    process.exit(1)
  }

  // 1. Firmar un ejemplo real (comprobación del algoritmo MD5 TOP)
  const sample = {
    method: 'aliexpress.solution.order.fulfill',
    app_key: '12345678',
    session: 'test',
    timestamp: '2019-01-01 12:00:00',
    format: 'json',
    v: '2.0',
    send_type: 'all',
    service_name: 'SPAIN_LOCAL_CORREOS',
  }
  const sig = signRequest(sample, 'helloworld')
  console.log('\n[1] Firma ejemplo:', sig)
  console.log(sig === '079359CA5468028AB5B855A6CC94F6BE' ? '  ✅ MD5(secret+params+secret) correcto' : '  ⚠️ No coincide (revisar algoritmo)')

  // 2. Producto real de prueba (un ID cualquiera de la web)
  const testUrl = 'https://es.aliexpress.com/item/1005006621129415.html'
  const productId = parseProductIdFromUrl(testUrl)
  console.log('\n[2] parseProductIdFromUrl:', productId)

  if (productId) {
    const details = await getProductDetails([productId])
    console.log(`  Productos devueltos: ${details.length}`)
    if (details[0]) {
      const p = details[0]
      console.log(`  - ${p.title}`)
      console.log(`    Precio: ${p.price} ${p.currency} | Original: ${p.originalPrice}`)
      console.log(`    URL: ${p.productUrl.slice(0, 80)}`)
      console.log(`    Rating: ${p.rating} | Pedidos: ${p.orders} | Stock: ${p.availableQuantity}`)
    }
  }

  // 3. Búsqueda por keyword
  console.log('\n[3] searchProducts("caña spinning")')
  const found = await searchProducts('caña spinning', { pageSize: 10 })
  console.log(`  Resultados: ${found.length}`)
  for (const p of found.slice(0, 5)) {
    console.log(`  - ${p.price}€ | ${p.title.slice(0, 60)}`)
  }

  // 4. Llamada cruda por si hay error_response (depurar)
  console.log('\n[4] Respuesta cruda product.query (diagnóstico)')
  const raw = await callAliExpressApi({
    method: 'aliexpress.affiliate.product.query',
    serviceParams: { keywords: 'carrete spinning', page_size: 3, target_currency: 'EUR', target_language: 'ES' },
  })
  console.log(JSON.stringify(raw, null, 2).slice(0, 1200))
}

main().catch(console.error)
