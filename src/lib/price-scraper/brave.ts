import { chromium, type Browser, type Page } from 'playwright'
import { existsSync } from 'fs'

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'

let _browser: Browser | null = null

export async function getBraveBrowser(headless = false): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser

  _browser = await chromium.launch({
    executablePath: BRAVE_PATH,
    headless,
  })

  _browser.on('disconnected', () => { _browser = null })

  return _browser
}

export async function bravePage(headless = false): Promise<Page> {
  const browser = await getBraveBrowser(headless)
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1920, height: 1080 },
  })
  return page
}

export async function closeBrave() {
  if (_browser) {
    await _browser.close().catch(() => {})
    _browser = null
  }
}

export function braveAvailable(): boolean {
  try {
    return existsSync(BRAVE_PATH)
  } catch {
    return false
  }
}
