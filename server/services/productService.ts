import { pool, query } from "../../src/lib/db";
import type { ResultSetHeader } from "mysql2/promise";

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
  review_count?: number;
  avg_rating?: number;
}

export interface ProductFilter {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  includeInactive?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
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
      c.name AS category_name,
      COALESCE(prs.review_count, 0) AS review_count,
      COALESCE(prs.avg_rating, 0) AS avg_rating
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    LEFT JOIN product_rating_summary prs ON p.product_id = prs.product_id
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

  if (filter.status) {
    sql += " AND p.status = ?";
    params.push(filter.status);
  } else if (!filter.includeInactive) {
    sql += " AND p.status != 'INACTIVE'";
  }

  sql += " ORDER BY p.product_id";

  const rows = await query<ProductWithCategory[]>(sql, params);
  return rows;
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
      c.name AS category_name,
      COALESCE(prs.review_count, 0) AS review_count,
      COALESCE(prs.avg_rating, 0) AS avg_rating
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    LEFT JOIN product_rating_summary prs ON p.product_id = prs.product_id
    WHERE p.product_id = ?
    LIMIT 1
  `;
  const rows = await query<ProductWithCategory[]>(sql, [id]);
  return rows[0] ?? null;
}

export interface ProductInput {
  category_id: number;
  brand_id: number;
  name: string;
  price: number;
  stock: number;
  warranty_month?: number | null;
  image?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  original_price?: number | null;
}

export async function createProduct(payload: ProductInput): Promise<ProductWithCategory> {
  const status = payload.status ?? "ACTIVE";
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO product 
      (category_id, brand_id, name, price, stock, warranty_month, image, description, status, original_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.category_id,
      payload.brand_id,
      payload.name,
      payload.price,
      payload.stock,
      payload.warranty_month ?? null,
      payload.image ?? null,
      payload.description ?? null,
      status,
      payload.original_price ?? null,
    ]
  );
  const id = Number((result as any)?.insertId);
  const created = await getProductById(id);
  if (!created) {
    throw new Error("Failed to fetch created product");
  }
  return created;
}

export async function updateProduct(
  id: number,
  payload: Partial<ProductInput>
): Promise<ProductWithCategory | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const status = payload.status ?? existing.status;

  await query(
    `UPDATE product
     SET category_id = ?, brand_id = ?, name = ?, price = ?, stock = ?, warranty_month = ?, image = ?, description = ?, status = ?, original_price = ?
     WHERE product_id = ?`,
    [
      payload.category_id ?? existing.category_id,
      payload.brand_id ?? existing.brand_id,
      payload.name ?? existing.name,
      payload.price ?? existing.price,
      payload.stock ?? existing.stock,
      payload.warranty_month ?? existing.warranty_month ?? null,
      payload.image ?? existing.image ?? null,
      payload.description ?? existing.description ?? null,
      status,
      payload.original_price ?? existing.original_price ?? null,
      id,
    ]
  );

  return getProductById(id);
}

export interface DeleteProductResult {
  deleted: boolean;
  blockedByReference?: boolean;
  deactivated?: boolean;
}

export async function deleteProduct(id: number): Promise<DeleteProductResult> {
  try {
    const res = await query<any>(`DELETE FROM product WHERE product_id = ?`, [id]);
    return { deleted: (res as any)?.affectedRows > 0 };
  } catch (err: any) {
    // MySQL error when row is referenced by FK (errno 1451 / ER_ROW_IS_REFERENCED_2)
    if (err?.errno === 1451 || err?.code === "ER_ROW_IS_REFERENCED_2") {
      // Soft-delete fallback: mark product inactive and zero stock so it disappears from public lists
      await query(
        `UPDATE product SET status = 'INACTIVE', stock = 0 WHERE product_id = ?`,
        [id]
      );
      return { deleted: false, blockedByReference: true, deactivated: true };
    }
    throw err;
  }
}
