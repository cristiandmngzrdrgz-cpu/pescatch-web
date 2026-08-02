import { getDb } from '../src/lib/db';

async function cleanOrphan() {
  const db = getDb();
  const slug = 'upf-50-sombrero-de-sol-de-ala-ancha-unisex-resistente-al-agua-con-solapa-de-cuel';

  // Buscar el deal
  const deal = await db.execute({
    sql: 'SELECT id FROM deals WHERE slug = ?',
    args: [slug],
  });

  if (deal.rows.length === 0) {
    console.log('✅ No se encontró el deal huérfano');
    return;
  }

  // Eliminar el deal
  await db.execute({
    sql: 'DELETE FROM deals WHERE slug = ?',
    args: [slug],
  });

  console.log(`✅ Eliminado deal huérfano: ${slug}`);
}

cleanOrphan().catch(console.error);