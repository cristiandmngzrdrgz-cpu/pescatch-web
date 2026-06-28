import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = '€'): string {
  return `${price.toFixed(2).replace('.', ',')}${currency}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getStockLabel(status: string, count?: number): string {
  switch (status) {
    case 'in_stock': return 'En stock'
    case 'limited': return `Últimas ${count} unidades`
    case 'out_of_stock': return 'Sin stock'
    default: return status
  }
}

export function getStockColor(status: string): string {
  switch (status) {
    case 'in_stock': return 'text-green-600'
    case 'limited': return 'text-amber-600'
    case 'out_of_stock': return 'text-red-600'
    default: return ''
  }
}
