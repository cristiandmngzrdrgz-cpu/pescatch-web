import { z } from 'zod'
import { CATEGORIES } from '@/types'

const validCategories = CATEGORIES.map(c => c.slug)

const urlSchema = z.string().url().optional().or(z.literal(''))

const priceSchema = z.number().positive().optional()

const shippingSchema = z.number().min(0).optional()

const eanSchema = z.string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => !val || val === '' || /^\d{13}$/.test(val),
    { message: 'EAN must be 13 digits or empty' }
  )

export const syncRowSchema = z.object({
  ean: eanSchema,
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional().or(z.literal('')),
  category: z.string().refine(
    (val) => validCategories.includes(val),
    { message: `Category must be one of: ${validCategories.join(', ')}` }
  ),
  subcategory: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  imageUrl: urlSchema,
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),

  amazonPrice: priceSchema,
  amazonUrl: urlSchema,
  amazonVariantAsin: z.string().optional().or(z.literal('')),
  amazonShipping: shippingSchema,
  amazonStock: z.string().optional().or(z.literal('')),
  amazonOriginalPrice: priceSchema,

  decathlonPrice: priceSchema,
  decathlonUrl: urlSchema,
  decathlonShipping: shippingSchema,
  decathlonStock: z.string().optional().or(z.literal('')),
  decathlonOriginalPrice: priceSchema,

  aliexpressPrice: priceSchema,
  aliexpressUrl: urlSchema,
  aliexpressShipping: shippingSchema,
  aliexpressStock: z.string().optional().or(z.literal('')),
  aliexpressOriginalPrice: priceSchema,

  technicalSpecs: z.string().optional().or(z.literal('')),
  review: z.string().optional().or(z.literal('')),
  pros: z.string().optional().or(z.literal('')),
  cons: z.string().optional().or(z.literal('')),
})

export interface ValidationResult {
  valid: boolean
  errors: string[]
  row?: z.infer<typeof syncRowSchema>
}

export function validateSyncRow(row: unknown): ValidationResult {
  const result = syncRowSchema.safeParse(row)

  if (result.success) {
    return { valid: true, errors: [], row: result.data }
  }

  const errors = result.error.issues.map(err => {
    const path = err.path.join('.')
    return `${path}: ${err.message}`
  })

  return { valid: false, errors }
}
