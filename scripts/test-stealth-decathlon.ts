import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
const USER_DATA_DIR = path.resolve('temp', 'brave-stealth-profile')
const DEALS_URL = 'https://www.decathlon.es/es/deals/f-sport_fishing_pesca-a-la-bolonesa_pesca-a-la-inglesa_pesca-a-la-tenya_pesca-al-coup-con-cana-enchufable_pesca-al-coup-con-cana-telescopica_pesca-al-quiver-feeder_pesca-al-surfcasting_pesca-al-toque_pesca-bajo-hielo_pesca-con-bombeta_pesca-con-flotador_pesca-con-gobio-manejado_pesca-con-jibionera_pesca-con-jig_pesca-con-mosca_pesca-con-pez-muerto-manejado_pesca-con-senuelos_pesca-de-arrastre_pesca-de-cangrejo-de-rio_pesca-de-la-lucioperca-con-senuelo_pesca-de-la-perca-con-senuelo_pesca-de-la-trucha-con-senuelo_pesca-de-sepia-y-calamar_pesca-de-sostener_pesca-de-truchas-en-embalse_pesca-del-black-bass-con-senuelo_pesca-del-lucio-con-senuelo_pesca-del-siluro_pesca-en-barco_pesca-en-kayak_pesca-exotica_pesca-fija_pesca-fija-1_pesca-submarina'

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('')
  console.log('=== Test Stealth Decathlon ===')
  console.log('')

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
    console.log(`Creado perfil persistente: ${USER_DATA_DIR}`)
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: BRAVE_PATH,
    headless: false,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=ChromeWhatsNewUI',
    ],
  })

  const page = await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
    Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en'] })
  })

  try {
    console.log('Navegando a la página de ofertas Decathlon...')
    await page.goto(DEALS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    console.log('  ✅ Página cargada (domcontentloaded)')

    await page.waitForTimeout(3000)
    const title = await page.title()
    console.log(`  Título: ${title}`)

    const bodyText = await page.evaluate(() => document.body?.textContent?.substring(0, 500) || '')
    console.log(`  Body (primeros 300 chars): ${bodyText.replace(/\s+/g, ' ').trim().slice(0, 300)}`)

    const isCaptcha = bodyText.toLowerCase().includes('verificación') ||
      bodyText.toLowerCase().includes('verify') ||
      bodyText.toLowerCase().includes('captcha') ||
      bodyText.toLowerCase().includes('seguridad')

    if (isCaptcha) {
      console.log('\n  ⚠️ CAPTCHA / verificación detectada!')
      console.log('  Esperando 60s para que resuelvas el captcha manualmente...')
      console.log('  -> Ve a la ventana de Brave y resuelve el captcha')
      
      for (let i = 60; i > 0; i--) {
        process.stdout.write(`\r  Esperando ${i}s...`)
        await sleep(1000)

        const text = await page.evaluate(() => document.body?.textContent?.substring(0, 500) || '')
        if (!text.toLowerCase().includes('verificación') && !text.toLowerCase().includes('verify')) {
          console.log('\n  ✅ Captcha resuelto!')
          await page.waitForTimeout(8000)
          console.log('  Esperando 8s para que cargue el contenido...')
          break
        }
      }
    }

    await page.waitForTimeout(5000)

    const currentUrl = page.url()
    console.log(`  URL actual: ${currentUrl}`)

    try { await page.waitForLoadState('networkidle', { timeout: 15000 }) } catch {}
    console.log('  (network idle)')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(3000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(3000)

    const bodyPreview = await page.evaluate(() => document.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 1000) || '')
    console.log(`  Body preview: ${bodyPreview.slice(0, 300)}...`)

    const hasProductCount = bodyPreview.match(/(\d+)\s*artículos/)
    if (hasProductCount) {
      console.log(`  📦 Total artículos anunciados: ${hasProductCount[1]}`)
    }

    const products = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/es/p/"]'))
      const seen = new Set<string>()
      return links.filter(a => {
        const href = (a as HTMLAnchorElement).href
        if (seen.has(href)) return false
        seen.add(href)
        return true
      }).slice(0, 10).map(a => ({
        url: (a as HTMLAnchorElement).href,
        title: a.getAttribute('title') || a.textContent?.trim().slice(0, 80) || '',
      }))
    })

    if (products.length > 0) {
      console.log(`\n  ✅ ${products.length} productos encontrados!`)
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title.slice(0, 60)}`)
      })
    } else {
      console.log('\n  ❌ No se encontraron productos')
      const allLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('decathlon'))
      )
      console.log(`  Total enlaces a decathlon: ${allLinks.length}`)
      if (allLinks.length > 0) {
        console.log(`  Primeros 5: ${allLinks.slice(0, 5).join(', ')}`)
      }
    }

  } catch (err) {
    console.error('Error:', err)
  } finally {
    console.log('\nCerrando navegador...')
    await context.close()
  }
}

main()
