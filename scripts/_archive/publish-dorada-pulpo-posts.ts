// PROPÓSITO: one-shot, publica los 2 posts nuevos (draft -> published) en local y Turso.
// FECHA: 2026-09-27.
import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env.vercel' });

const SLUGS = ['pesca-dorada-guia-completa-2026', 'pesca-pulpo-eging-polpara-tecnicas-equipo-2026'];

async function main() {
  const now = new Date().toISOString();
  const local = createClient({ url: 'file:D:/01_PROYECTOS/Workbench/Desktop/Web_chollos_pesca/data/pescatch.db' });
  const turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  for (const slug of SLUGS) {
    for (const [name, db] of [['LOCAL', local], ['TURSO', turso]] as const) {
      const before = await db.execute({ sql: 'SELECT slug, status, hidden FROM posts WHERE slug = ?', args: [slug] });
      console.log(`${name} antes:`, JSON.stringify(before.rows));
      await db.execute({ sql: 'UPDATE posts SET status = ?, hidden = ?, publishedAt = ?, updatedAt = ? WHERE slug = ?', args: ['published', 0, now, now, slug] });
      const after = await db.execute({ sql: 'SELECT slug, status, hidden FROM posts WHERE slug = ?', args: [slug] });
      console.log(`${name} después:`, JSON.stringify(after.rows));
    }
  }
  local.close();
  turso.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
