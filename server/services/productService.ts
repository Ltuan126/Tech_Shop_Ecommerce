import type { ResultSetHeader } from "mysql2/promise";
import { pool, query } from "../../src/lib/db";

interface ProductRow {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  image: string | null;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  warrantyMonth: number | null;
  categoryId: number | null;
  categoryName: string | null;
  brandId: number | null;
  brandName: string | null;
}

export interface ProductRecord {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  description: string | null;
  category: string | null;
  brand?: string | null;
  stock: number;
  warrantyMonth: number | null;
  inStock: boolean;
  rating: number;
  reviews: number;
}

export interface ProductInput {
  name: string;
  price: number;
  categoryId: number;
  brandId: number;
  stock?: number;
  originalPrice?: number | null;
  image?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  warrantyMonth?: number | null;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  data: ProductRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const baseSelect = `SELECT
    p.product_id AS id,
    p.name,
    p.price,
    p.original_price AS originalPrice,
    p.stock,
    p.image,
    p.description,
    p.status,
    p.warranty_month AS warrantyMonth,
    p.category_id AS categoryId,
    p.brand_id AS brandId,
    c.name AS categoryName,
    b.brand_name AS brandName
  FROM product p
  LEFT JOIN category c ON p.category_id = c.category_id
  LEFT JOIN brand b ON p.brand_id = b.brand_id`;

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
    image: row.image,
    description: row.description,
    category: row.categoryName ?? null,
    brand: row.brandName ?? null,
    stock: row.stock ?? 0,
    warrantyMonth: row.warrantyMonth ?? null,
    inStock: row.status === "ACTIVE" && (row.stock ?? 0) > 0,
    rating: 0,
    reviews: 0,
  };
}

export async function listLatestProducts(limit = 20) {
  const rows = await query<ProductRow[]>(`${baseSelect} ORDER BY p.product_id DESC LIMIT ?`, [limit]);
  return rows.map(mapProduct);
}

export async function listProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search) {
    conditions.push("(LOWER(p.name) LIKE ? OR LOWER(c.name) LIKE ?)");
    const keyword = `%${filters.search.toLowerCase()}%`;
    params.push(keyword, keyword);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.category) {
    conditions.push("c.name = ?");
    params.push(filters.category);
  }

  if (typeof filters.minPrice === "number") {
    conditions.push("p.price >= ?");
    params.push(filters.minPrice);
  }

  if (typeof filters.maxPrice === "number") {
    conditions.push("p.price <= ?");
    params.push(filters.maxPrice);
  }

  if (filters.inStockOnly) {
    conditions.push("(p.stock > 0 AND p.status = 'ACTIVE')");
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const offset = (page - 1) * pageSize;

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query<ProductRow[]>(
    `${baseSelect} ${whereClause} ORDER BY p.product_id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const totalRows = await query<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM product p LEFT JOIN category c ON p.category_id = c.category_id ${whereClause}`,
    params
  );

  const totalItems = totalRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    data: rows.map(mapProduct),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getProductById(id: number): Promise<ProductRecord | null> {
  const rows = await query<ProductRow[]>(`${baseSelect} WHERE p.product_id = ? LIMIT 1`, [id]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function createProduct(payload: ProductInput): Promise<ProductRecord> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO product 
      (name, price, original_price, stock, warranty_month, image, description, status, category_id, brand_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.price,
      payload.originalPrice ?? null,
      payload.stock ?? 0,
      payload.warrantyMonth ?? null,
      payload.image ?? null,
      payload.description ?? null,
      payload.status ?? "ACTIVE",
      payload.categoryId,
      payload.brandId,
    ]
  );

  const newId = result.insertId;
  const created = await getProductById(newId);
  if (!created) {
    throw new Error("Product was created but could not be retrieved.");
  }
  return created;
}

export async function updateProduct(id: number, payload: Partial<ProductInput>): Promise<ProductRecord | null> {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  const mapField = (column: string, value: unknown) => {
    if (typeof value !== "undefined") {
      fields.push(`${column} = ?`);
      params.push(value as never);
    }
  };

  mapField("name", payload.name);
  mapField("price", payload.price);
  mapField("original_price", payload.originalPrice ?? null);
  mapField("stock", payload.stock ?? null);
  mapField("warranty_month", payload.warrantyMonth ?? null);
  mapField("image", payload.image ?? null);
  mapField("description", payload.description ?? null);
  mapField("status", payload.status ?? null);
  mapField("category_id", payload.categoryId ?? null);
  mapField("brand_id", payload.brandId ?? null);

  if (!fields.length) {
    return getProductById(id);
  }

  params.push(id);
  await pool.execute(`UPDATE product SET ${fields.join(", ")} WHERE product_id = ?`, params);

  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<void> {
  await pool.execute(`DELETE FROM product WHERE product_id = ?`, [id]);
}
