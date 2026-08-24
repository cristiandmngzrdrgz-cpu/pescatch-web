import type { BrowserContext, Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

// playwright se importa dinámicamente dentro de launchBraveContext: solo existe
// en local (Brave instalado). Un import estático rompe el bundle serverless de
// Vercel aunque las funciones nunca lleguen a ejecutarse allí.

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'

export function braveAvailable(): boolean {
  try {
    return fs.existsSync(BRAVE_PATH)
  } catch {
    return false
  }
}

export function getBravePath(): string {
  return BRAVE_PATH
}

export async function launchBraveContext(
  profileDir: string,
  options?: { headless?: boolean }
): Promise<BrowserContext> {
  const { chromium } = await import('playwright')
  const userDataDir = path.resolve('temp', profileDir)

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: BRAVE_PATH,
    headless: options?.headless ?? false,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    viewport: { width: 1920, height: 1080 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  })

  return context
}

export async function setupStealthPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
}
