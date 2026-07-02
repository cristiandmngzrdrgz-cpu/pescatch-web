import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:data/pescatch.db",
});

async function queryDeals() {
  const result = await client.execute("SELECT title, salePrice, originalPrice, storeName, affiliateUrl, imageUrl, ean FROM deals ORDER BY salePrice ASC");
  console.log(JSON.stringify(result.rows));
}

queryDeals();