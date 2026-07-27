export function parseSpanishPrice(text: string): number {
  if (!text) return 0
  const clean = text.replace(/[^0-9.,]/g, '')

  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean)) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0
  }

  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(clean)) {
    return parseFloat(clean.replace(/,/g, '')) || 0
  }

  const normalized = clean.replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : Math.round(num * 100) / 100
}
