import { getDb } from '../src/lib/db';

async function checkDescriptions() {
  const db = getDb();
  
  const products = await db.execute({
    sql: `
      SELECT name, description 
      FROM products 
      WHERE name LIKE '%UPF%' 
         OR name LIKE '%BUDEFO%'
         OR name LIKE '%EVA%'
         OR name LIKE '%Phishger%'
    `,
    args: [],
  });
  
  if (products.rows.length === 0) {
    console.log("No se encontraron productos.");
    return;
  }
  
  console.log("=== CONTENIDO EN LA BASE DE DATOS ===\n");
  products.rows.forEach(row => {
    console.log(`📌 **${row.name}**`);
    console.log(`📝 Descripción: ${row.description ? "✅ Tiene contenido" : "❌ Vacío"}`);
    console.log("---\n");
  });
}

checkDescriptions().catch(console.error);