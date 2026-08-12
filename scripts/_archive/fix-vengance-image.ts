// PROPÓSITO: Arreglar imagen rota de Shimano Vengeance CX en el post kit-completo-empezar-pescar-2026
// FECHA: 2026-08-11
// Uso: npx tsx scripts/fix-vengance-image.ts
import { getPostBySlug, updatePost } from '../src/data/blog-queries'

const OLD_IMG = 'https://m.media-amazon.com/images/I/41L7cdhjPsL._AC_SX679_.jpg'
const NEW_IMG = 'https://m.media-amazon.com/images/I/31-L5pCOJHL._AC_SL1500_.jpg'

async function main() {
  const slug = 'kit-completo-empezar-pescar-2026'
  const post = await getPostBySlug(slug, true)
  if (!post) {
    console.error('Post no encontrado')
    process.exit(1)
  }

  const newContent = post.content.split(OLD_IMG).join(NEW_IMG)
  const newFeatured = post.featuredImage === OLD_IMG ? NEW_IMG : post.featuredImage

  await updatePost(post.id, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: newContent,
    featuredImage: newFeatured,
    author: post.author,
    category: post.category,
    tags: post.tags,
    relatedAsins: post.relatedAsins,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    focusKeyword: post.focusKeyword,
    status: post.status,
  })

  const updated = await getPostBySlug(slug, true)
  const stillBroken = updated!.content.includes(OLD_IMG) || updated!.featuredImage === OLD_IMG
  console.log('featuredImage:', updated!.featuredImage)
  console.log('¿queda imagen rota?:', stillBroken ? 'SÍ' : 'no')
  console.log('updatedAt:', updated!.updatedAt)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
