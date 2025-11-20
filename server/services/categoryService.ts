import { query } from "../../src/lib/db";

export interface Category {
  category_id: number;
  name: string;
  parent_id?: number | null;
}

export interface CategoryPayload {
  name: string;
}

export async function listCategories(): Promise<Category[]> {
  const sql = `
    SELECT category_id, name, parent_id
    FROM category
    ORDER BY category_id
  `;
  const rows = await query<Category[]>(sql);
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const sql = `
    SELECT category_id, name, parent_id
    FROM category
    WHERE category_id = ?
    LIMIT 1
  `;
  const rows = await query<Category[]>(sql, [id]);
  return rows[0] ?? null;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const sql = `
    INSERT INTO category (name, parent_id)
    VALUES (?, NULL)
  `;
  const [result] = (await query(sql, [payload.name])) as any;
  const insertId = result.insertId as number;

  const cat = await getCategoryById(insertId);
  return cat as Category;
}

export async function updateCategory(
  id: number,
  payload: Partial<CategoryPayload>
): Promise<Category | null> {
  const sql = `
    UPDATE category
    SET name = ?
    WHERE category_id = ?
  `;
  const [result] = (await query(sql, [payload.name, id])) as any;
  const affected = (result.affectedRows ?? 0) as number;

  if (!affected) return null;

  const cat = await getCategoryById(id);
  return cat as Category;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const sql = `
    DELETE FROM category
    WHERE category_id = ?
  `;
  const [result] = (await query(sql, [id])) as any;
  const affected = (result.affectedRows ?? 0) as number;
  return affected > 0;
}
