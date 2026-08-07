import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'PesCatch <noreply@pescatch.es>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export function isEmailConfigured(): boolean {
  return Boolean(resend)
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured. Set RESEND_API_KEY in .env')
    return false
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('Error sending email:', err)
    return false
  }
}

export async function sendAdminNotification(subject: string, html: string): Promise<boolean> {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not configured')
    return false
  }
  return sendEmail(ADMIN_EMAIL, `[PesCatch Admin] ${subject}`, html)
}

function emailStyles() {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B1120; color: #E8F0FE; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #0B1A30, #111827); border-radius: 16px 16px 0 0; border-bottom: 2px solid #00D4FF; }
      .header h1 { color: #E8F0FE; margin: 0; font-size: 28px; }
      .header p { color: #8BA3C7; margin: 8px 0 0; }
      .content { background: #111827; padding: 30px; border-radius: 0 0 16px 16px; }
      .deal-card { background: #0B1120; border: 1px solid #1E3A5F; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
      .deal-title { color: #E8F0FE; font-size: 16px; font-weight: 700; margin: 0 0 8px; }
      .deal-price { color: #FFB800; font-size: 24px; font-weight: 800; }
      .deal-original { color: #4A6080; text-decoration: line-through; font-size: 14px; margin-left: 8px; }
      .deal-discount { background: #FF4757; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; }
      .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00D4FF, #0099CC); color: #0B1120; text-decoration: none; border-radius: 24px; font-weight: 700; }
      .btn-green { background: linear-gradient(135deg, #26DE81, #1DBB6E); }
      .footer { text-align: center; padding: 20px; color: #4A6080; font-size: 12px; }
      .footer a { color: #00D4FF; }
    </style>
  `
}

export function buildNewsletterHtml(deals: Array<{
  title: string
  salePrice: number
  originalPrice: number
  discountPercent: number
  storeName: string
  slug: string
  imageUrl?: string
}>, unsubscribeUrl: string): string {
  const BASE_URL = 'https://www.pescatch.es'
  const dealsHtml = deals.map(deal => `
    <div class="deal-card">
      <p class="deal-title">${deal.title}</p>
      <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
        <span class="deal-price">${deal.salePrice.toFixed(2)}€</span>
        <span class="deal-original">${deal.originalPrice.toFixed(2)}€</span>
        <span class="deal-discount">-${deal.discountPercent}%</span>
      </div>
      <p style="color: #8BA3C7; font-size: 13px; margin: 4px 0;">${deal.storeName}</p>
      <a href="${BASE_URL}/deals/${deal.slug}" class="btn" style="margin-top: 8px;">Ver chollo</a>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎣 Chollos de la semana</h1>
          <p>Los mejores descuentos en material de pesca</p>
        </div>
        <div class="content">
          ${dealsHtml}
          <div style="text-align: center; margin-top: 30px;">
            <a href="${BASE_URL}/search" class="btn">Ver todos los chollos</a>
          </div>
        </div>
        <div class="footer">
          <p>Recibes este email porque te suscribiste a PesCatch.</p>
          <p><a href="${unsubscribeUrl}">Cancelar suscripción</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function buildPriceAlertHtml(deal: {
  title: string
  salePrice: number
  originalPrice: number
  previousPrice: number
  storeName: string
  slug: string
}, unsubscribeUrl: string): string {
  const BASE_URL = 'https://www.pescatch.es'
  const savings = deal.previousPrice - deal.salePrice

  return `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 ¡Bajada de precio!</h1>
          <p>Un producto que sigues ha bajado de precio</p>
        </div>
        <div class="content">
          <div class="deal-card">
            <p class="deal-title">${deal.title}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin: 12px 0;">
              <span class="deal-price">${deal.salePrice.toFixed(2)}€</span>
              <span class="deal-original">${deal.originalPrice.toFixed(2)}€</span>
            </div>
            <p style="color: #26DE81; font-size: 14px; font-weight: 600;">
              ⬇️ Ha bajado ${savings.toFixed(2)}€ (antes ${deal.previousPrice.toFixed(2)}€)
            </p>
            <p style="color: #8BA3C7; font-size: 13px;">${deal.storeName}</p>
            <a href="${BASE_URL}/deals/${deal.slug}" class="btn btn-green" style="margin-top: 12px;">Ver chollo ahora</a>
          </div>
        </div>
        <div class="footer">
          <p>Recibes este email porque activaste una alerta de precio.</p>
          <p><a href="${unsubscribeUrl}">Desactivar esta alerta</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function buildAdminNotificationHtml(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚙️ ${title}</h1>
        </div>
        <div class="content">
          ${body}
        </div>
        <div class="footer">
          <p>Notificación automática de PesCatch Admin.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
