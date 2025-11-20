import { query } from "../../src/lib/db";

export interface Product {
  product_id: number;
  category_id: number;
  brand_id: number;
  name: string;
  price: number;
  stock: number;
  warranty_month?: number | null;
  image?: string | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  original_price?: number | null;
}

export interface ProductWithCategory extends Product {
  category_name?: string | null;
}

export interface ProductFilter {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
}

export async function listProducts(
  filter: ProductFilter
): Promise<ProductWithCategory[]> {
  let sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.name,
      p.price,
      p.stock,
      p.warranty_month,
      p.image,
      p.description,
      p.status,
      p.original_price,
      c.name AS category_name
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE 1 = 1
  `;

  const params: any[] = [];

  if (typeof filter.categoryId === "number") {
    sql += " AND p.category_id = ?";
    params.push(filter.categoryId);
  }

  if (typeof filter.priceMin === "number") {
    sql += " AND p.price >= ?";
    params.push(filter.priceMin);
  }

  if (typeof filter.priceMax === "number") {
    sql += " AND p.price <= ?";
    params.push(filter.priceMax);
  }

  sql += " ORDER BY p.product_id";

  const [rows] = (await query(sql, params)) as any;
  return rows as ProductWithCategory[];
}

export async function getProductById(
  id: number
): Promise<ProductWithCategory | null> {
  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.name,
      p.price,
      p.stock,
      p.warranty_month,
      p.image,
      p.description,
      p.status,
      p.original_price,
      c.name AS category_name
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE p.product_id = ?
    LIMIT 1
  `;
  const [rows] = (await query(sql, [id])) as any;
  const list = rows as ProductWithCategory[];
  return list[0] ?? null;
}
