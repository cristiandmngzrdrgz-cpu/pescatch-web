// @ts-nocheck
import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
const USER_DATA_DIR = path.resolve('temp', 'brave-decathlon-profile')
const DEALS_URL = 'https://www.decathlon.es/es/deals/f-sport_fishing_pesca-a-la-bolonesa_pesca-a-la-inglesa_pesca-a-la-tenya_pesca-al-coup-con-cana-enchufable_pesca-al-coup-con-cana-telescopica_pesca-al-quiver-feeder_pesca-al-surfcasting_pesca-al-toque_pesca-bajo-hielo_pesca-con-bombeta_pesca-con-flotador_pesca-con-gobio-manejado_pesca-con-jibionera_pesca-con-jig_pesca-con-mosca_pesca-con-pez-muerto-manejado_pesca-con-senuelos_pesca-de-arrastre_pesca-de-cangrejo-de-rio_pesca-de-la-lucioperca-con-senuelo_pesca-de-la-perca-con-senuelo_pesca-de-la-trucha-con-senuelo_pesca-de-sepia-y-calamar_pesca-de-sostener_pesca-de-truchas-en-embalse_pesca-del-black-bass-con-senuelo_pesca-del-lucio-con-senuelo_pesca-del-siluro_pesca-en-barco_pesca-en-kayak_pesca-exotica_pesca-fija_pesca-fija-1_pesca-submarina'

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'rapala', 'caperlan', 'beuchat', 'garbolino', 'storm',
]

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const brand of POPULAR_BRANDS) {
    if (lower.startsWith(brand)) return brand.charAt(0).toUpperCase() + brand.slice(1)
  }
  return null
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('')
  console.log('=== Stealth Decathlon v2 (perfil persistente) ===')
  console.log(`Perfil: ${USER_DATA_DIR}`)
  console.log('')

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: BRAVE_PATH,
    headless: false,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    viewport: { width: 1920, height: 1080 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
    ],
  })

  const page = context.pages()[0] || await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  try {
    console.log('1. Cargando página...')
    await page.goto(DEALS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

    const initialText = await page.evaluate(() => document.body?.textContent?.slice(0, 300) || '')
    const hasCaptcha = initialText.toLowerCase().includes('verificación') || initialText.toLowerCase().includes('verify')

    if (hasCaptcha) {
      console.log('   ⚠️ Captcha detectado.')
      console.log('   -> Resuélvelo en la ventana de Brave que se abrió')
      console.log('   -> Te esperaré hasta 120s')

      for (let i = 120; i > 0; i--) {
        process.stdout.write(`\r   Esperando ${i}s... `)
        await sleep(1000)
        const text = await page.evaluate(() => document.body?.textContent?.slice(0, 200) || '')
        if (!text.toLowerCase().includes('verificación') && !text.toLowerCase().includes('verify')) {
          console.log('\n   ✅ Captcha resuelto!')
          break
        }
      }
    } else {
      console.log('   ✅ Sin captcha!')
    }

    console.log('\n2. Esperando carga completa del contenido...')
    await page.waitForLoadState('networkidle').catch(() => {})
    await sleep(8000)

    const currentUrl = page.url()
    console.log(`   URL: ${currentUrl}`)

    const title = await page.title()
    console.log(`   Título: ${title}`)

    console.log('\n3. Haciendo scroll lento para trigger lazy loading...')
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 600))
      await sleep(1500)
    }
    await sleep(3000)

    // Try multiple ways to find products
    console.log('\n4. Buscando productos...')

    const products = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/es/p/"], a[href*="/p/"]'))
      const seen = new Set<string>()
      const first = anchors[0]
      if (first) {
        const info = {
          href: first.href,
          outerHTML: first.outerHTML.slice(0, 600),
          tagName: first.tagName,
          className: first.className,
          parentClassName: first.parentElement?.className || '',
          parentOuter: first.parentElement?.outerHTML?.slice(0, 300) || '',
        }
        return { debug: info, items: [] }
      }
      return { debug: null, items: [] }
    })

    const info = products as any
    if (info.debug) {
      console.log('   Primer link HTML:')
      console.log(`   ${info.debug.outerHTML}`)
      console.log(`   Clase padre: ${info.debug.parentClassName}`)
      console.log(`   Padre: ${info.debug.parentOuter}`)
    }

    const fullProductData = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="product-card"], [class*="ProductCard"], [class*="product-tile"], [class*="ProductTile"]')
      const results: Array<{ title: string; price: string; url: string; brand: string }> = []
      const seen = new Set<string>()

      for (const card of cards) {
        const link = card.querySelector<HTMLAnchorElement>('a[href*="/p/"]')
        if (!link) continue
        const url = link.href
        if (seen.has(url)) continue
        seen.add(url)

        const titleEl = card.querySelector('[class*="title"], [class*="Title"], h2, h3, [class*="name"], [class*="Name"]')
        const title = titleEl?.textContent?.trim() || ''
        const priceEl = card.querySelector('[class*="price"], [class*="Price"]')
        const price = priceEl?.textContent?.trim()?.replace(/[^0-9.,]/g, '').replace(',', '.') || ''
        const img = card.querySelector('img')?.getAttribute('src') || card.querySelector('img')?.getAttribute('srcset') || ''

        const brand = title.split(/\s+/)[0] || ''
        results.push({ title: title.slice(0, 120), price, url, brand })
      }
      return results
    })

    console.log(`\n   Productos via card selector: ${fullProductData.length}`)

    console.log(`   ${products.length} productos encontrados via <a href=\"/p/\">\n`)

    // Also try to extract from structured data
    const jsonLdProducts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const items: Array<{ name: string; price: string; url: string }> = []
      for (const s of scripts) {
        try {
          const data = JSON.parse(s.textContent || '')
          if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
            for (const item of data.itemListElement) {
              const p = item.item || item
              items.push({
                name: p.name || '',
                price: p.offers?.price || '',
                url: p.url || '',
              })
            }
          }
        } catch {}
      }
      return items
    })
    console.log(`   ${jsonLdProducts.length} productos en JSON-LD ItemList\n`)

    // Parse products from the text content as fallback
    const allText = await page.evaluate(() => document.body?.textContent?.replace(/\s+/g, ' ') || '')
    const hasArticulos = allText.match(/(\d+)\s*artículos/)
    if (hasArticulos) console.log(`   Total según página: ${hasArticulos[1]} artículos`)

    if (fullProductData.length > 0) {
      console.log('   ── PRODUCTOS ENCONTRADOS ──')
      fullProductData.slice(0, 25).forEach((p, i) => {
        const brandStr = (p.brand || '?').padEnd(12)
        console.log(`   ${(i + 1).toString().padStart(2)}. ${brandStr} ${p.title.slice(0, 65)} | ${p.price || '?'}€`)
      })
    } else {
      console.log('   Body preview:', allText.slice(0, 500))
    }

  } catch (err) {
    console.error('Error:', err)
  } finally {
    console.log('\n5. Cerrando navegador (se guarda el perfil)...')
    await context.close()
    console.log('   Perfil guardado en:', USER_DATA_DIR)
    console.log('   En la próxima ejecución, el captcha NO debería aparecer\n')
  }
}

main()
