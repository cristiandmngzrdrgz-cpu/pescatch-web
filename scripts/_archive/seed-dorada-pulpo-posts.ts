// PROPÓSITO: seed one-shot de los 2 posts nuevos (dorada + pulpo) en DB local como draft.
// FECHA: 2026-09-27. Mover a scripts/_archive/ cuando termine.
import { createClient } from '@libsql/client';
import { DORADA } from './seed-dorada-pulpo/dorada';
import { PULPO } from './seed-dorada-pulpo/pulpo';

interface Post {
  slug: string; title: string; excerpt: string; category: string;
  tags: string[]; relatedAsins: string[];
  metaTitle: string; metaDescription: string; canonicalUrl: string; focusKeyword: string;
  content: string;
  productsData: Array<{ title: string; rating: number; image: string; scores: Record<string, number>; stores: Array<{ name: string; url: string; price: string }>; badge?: string; badgeColor?: string }>;
}

async function seedOne(dbUrl: string, post: Post) {
  const db = createClient({ url: dbUrl });
  const existing = await db.execute({ sql: 'SELECT id FROM posts WHERE slug = ?', args: [post.slug] });
  if (existing.rows.length > 0) {
    console.log(`SKIP (ya existe): ${post.slug}`);
    db.close();
    return;
  }
  const now = new Date().toISOString();
  const fullContent = post.content + `\n\n<!-- PRODUCTS_DATA: ${JSON.stringify(post.productsData)} -->`;
  const firstImg = (post.productsData[0] as { image?: string }).image || '';
  await db.execute({
    sql: `INSERT INTO posts (id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, hidden, status, metaTitle, metaDescription, canonicalUrl, focusKeyword, publishedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `post_${Date.now()}_${post.slug}`, post.title, post.slug, post.excerpt, fullContent, firstImg,
      'PesCatch', post.category, JSON.stringify(post.tags), JSON.stringify(post.relatedAsins),
      1, 'draft', post.metaTitle, post.metaDescription, post.canonicalUrl, post.focusKeyword,
      now, now, now,
    ],
  });
  console.log(`OK insertado como draft: ${post.slug}`);
  db.close();
}

async function main() {
  const dbUrl = 'file:D:/01_PROYECTOS/Workbench/Desktop/Web_chollos_pesca/data/pescatch.db';
  await seedOne(dbUrl, DORADA);
  await seedOne(dbUrl, PULPO);
}

main().catch((e) => { console.error(e); process.exit(1); });
