import { z } from 'zod'

export class ValidationError extends Error {
  constructor(public issues: { path: string; message: string }[]) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    )
  }
  return result.data
}

export const dealSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  slug: z.string().min(1, 'El slug es obligatorio').max(200).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(2000).default(''),
  originalPrice: z.number().min(0),
  salePrice: z.number().min(0),
  shippingCost: z.number().min(0).default(0),
  imageUrl: z.string().default(''),
  images: z.array(z.string()).default([]),
  storeId: z.string().default(''),
  storeName: z.string().default(''),
  storeUrl: z.string().default(''),
  storeReputation: z.enum(['good', 'neutral', 'poor']).default('good'),
  storeCommissionRate: z.number().min(0).max(1).default(0),
  affiliateUrl: z.string().default(''),
  category: z.string().default(''),
  subcategory: z.string().default(''),
  tags: z.array(z.string()).default([]),
  stockStatus: z.enum(['in_stock', 'limited', 'out_of_stock']).default('in_stock'),
  stockCount: z.number().int().min(0).optional(),
  expiresAt: z.string().optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  technicalSpecs: z.record(z.string(), z.string()).default({}),
  review: z.string().default(''),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  commission: z.number().min(0).default(0),
  ean: z.string().default(''),
  asin: z.string().default(''),
  brand: z.string().default(''),
  productId: z.string().default(''),
  metaTitle: z.string().max(200).default(''),
  metaDescription: z.string().max(500).default(''),
  canonicalUrl: z.string().default(''),
  focusKeyword: z.string().default(''),
})

export const postSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  slug: z.string().min(1, 'El slug es obligatorio').max(200).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  excerpt: z.string().max(500).default(''),
  content: z.string().default(''),
  featuredImage: z.string().default(''),
  category: z.string().default(''),
  author: z.string().default('PesCatch'),
  tags: z.array(z.string()).default([]),
  relatedAsins: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  hidden: z.boolean().optional(),
  publishedAt: z.string().optional(),
  metaTitle: z.string().max(200).default(''),
  metaDescription: z.string().max(500).default(''),
  canonicalUrl: z.string().default(''),
  focusKeyword: z.string().default(''),
})

export type DealInput = z.infer<typeof dealSchema>
export type PostInput = z.infer<typeof postSchema>
