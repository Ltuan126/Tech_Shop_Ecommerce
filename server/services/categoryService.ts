import { query } from "../../src/lib/db";

export interface CategoryRecord {
  name: string;
  slug: string;
  productCount: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function listCategories(): Promise<CategoryRecord[]> {
  const rows = await query<{ name: string; productCount: number }[]>(
    `SELECT c.name, COUNT(p.product_id) AS productCount
     FROM category c
     LEFT JOIN product p ON p.category_id = c.category_id
     GROUP BY c.category_id, c.name
     ORDER BY c.name`
  );

  return rows.map((row) => ({
    name: row.name,
    slug: slugify(row.name),
    productCount: Number(row.productCount) ?? 0,
  }));
}
