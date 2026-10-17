// PROPÓSITO: one-shot, borra el post viejo dorada/choco de local y Turso (reemplazado por los 2 nuevos).
// FECHA: 2026-09-27.
import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env.vercel' });

async function main() {
  const slug = 'mejor-cana-surfcasting-420-dorada-choco-2026';
  const apply = process.argv.includes('--apply');
  const local = createClient({ url: 'file:D:/01_PROYECTOS/Workbench/Desktop/Web_chollos_pesca/data/pescatch.db' });
  const lr = await local.execute({ sql: 'SELECT id, title, status FROM posts WHERE slug = ?', args: [slug] });
  console.log('LOCAL:', JSON.stringify(lr.rows));
  const turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  const tr = await turso.execute({ sql: 'SELECT id, title, status FROM posts WHERE slug = ?', args: [slug] });
  console.log('TURSO:', JSON.stringify(tr.rows));
  if (apply) {
    await local.execute({ sql: 'DELETE FROM posts WHERE slug = ?', args: [slug] });
    console.log('LOCAL borrado');
    await turso.execute({ sql: 'DELETE FROM posts WHERE slug = ?', args: [slug] });
    console.log('TURSO borrado');
  } else {
    console.log('(DRY-RUN: usa --apply)');
  }
  local.close();
  turso.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
