import { getDb } from '../src/lib/db';

async function findSombreroName() {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT name FROM products WHERE name LIKE '%UPF%' OR name LIKE '%sombrero%' OR name LIKE '%protección solar%'",
    args: [],
  });
  
  if (result.rows.length === 0) {
    console.log("No se encontraron productos con 'UPF', 'sombrero' o 'protección solar'.");
    return;
  }
  
  console.log("Posibles coincidencias:");
  result.rows.forEach(row => console.log(`- ${row.name}`));
}

findSombreroName().catch(console.error);