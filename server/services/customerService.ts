import { query, pool } from "../../src/lib/db";
import bcrypt from "bcryptjs";

export interface CustomerRecord {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  role: string;
}

export interface CustomerWithOrders extends CustomerRecord {
  orderCount: number;
  totalSpent: number;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface UpdateCustomerPayload {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

/**
 * List all customers (users with role 'CUSTOMER')
 * Supports filtering by keyword (name/email) and city
 */
export const listCustomers = async (filter: any): Promise<CustomerWithOrders[]> => {
  const { keyword, city } = filter;

  let sql = `
    SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.phone,
      u.address,
      u.city,
      u.role,
      COUNT(DISTINCT o.order_id) AS orderCount,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM user u
    LEFT JOIN customer c ON c.user_id = u.user_id
    LEFT JOIN \`order\` o ON o.customer_id = c.customer_id
    WHERE u.role IN ('CUSTOMER', 'USER')
  `;

  const params: any[] = [];

  if (keyword) {
    sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    const searchTerm = `%${keyword}%`;
    params.push(searchTerm, searchTerm);
  }

  if (city) {
    sql += ` AND u.city LIKE ?`;
    params.push(`%${city}%`);
  }

  sql += ` GROUP BY u.user_id ORDER BY u.user_id DESC`;

  const rows = await query<any[]>(sql, params);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    role: row.role,
    orderCount: Number(row.orderCount),
    totalSpent: Number(row.totalSpent)
  }));
};

/**
 * Get a single customer by ID with order history
 */
export const getCustomerById = async (id: number): Promise<CustomerWithOrders | null> => {
  const sql = `
    SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.phone,
      u.address,
      u.city,
      u.role,
      COUNT(DISTINCT o.order_id) AS orderCount,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM user u
    LEFT JOIN customer c ON c.user_id = u.user_id
    LEFT JOIN \`order\` o ON o.customer_id = c.customer_id
    WHERE u.user_id = ? AND u.role IN ('CUSTOMER','USER')
    GROUP BY u.user_id
    LIMIT 1
  `;

  const rows = await query<any[]>(sql, [id]);

  if (!rows[0]) {
    return null;
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    role: row.role,
    orderCount: Number(row.orderCount),
    totalSpent: Number(row.totalSpent)
  };
};

export const createCustomer = async (payload: CreateCustomerPayload): Promise<CustomerWithOrders> => {
  const { name, email, password, phone = null, address = null, city = null } = payload;

  const existing = await query<any[]>(`SELECT user_id FROM user WHERE email = ? LIMIT 1`, [email]);
  if (existing[0]) {
    throw new Error("Email đã tồn tại");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [userResult] = await conn.execute(
      `INSERT INTO user (name, email, password, role, phone, address, city) VALUES (?, ?, ?, 'CUSTOMER', ?, ?, ?)`,
      [name, email, passwordHash, phone, address, city]
    );
    const userId = (userResult as any).insertId;
    await conn.execute(
      `INSERT INTO customer (user_id, phone, address, city) VALUES (?, ?, ?, ?)`,
      [userId, phone, address, city]
    );
    await conn.commit();
    const created = await getCustomerById(userId);
    if (!created) {
      throw new Error("Không thể tạo khách hàng");
    }
    return created;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateCustomer = async (id: number, payload: UpdateCustomerPayload): Promise<CustomerWithOrders | null> => {
  const fields: string[] = [];
  const params: any[] = [];

  if (payload.name !== undefined) {
    fields.push("name = ?");
    params.push(payload.name);
  }
  if (payload.email !== undefined) {
    fields.push("email = ?");
    params.push(payload.email);
  }
  if (payload.phone !== undefined) {
    fields.push("phone = ?");
    params.push(payload.phone);
  }
  if (payload.address !== undefined) {
    fields.push("address = ?");
    params.push(payload.address);
  }
  if (payload.city !== undefined) {
    fields.push("city = ?");
    params.push(payload.city);
  }
  if (payload.password) {
    fields.push("password = ?");
    params.push(await bcrypt.hash(payload.password, 10));
  }

  if (fields.length === 0) {
    return getCustomerById(id);
  }

  params.push(id);
  await query(`UPDATE user SET ${fields.join(", ")} WHERE user_id = ? AND role IN ('CUSTOMER','USER')`, params);
  await query(
    `UPDATE customer SET phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city) WHERE user_id = ?`,
    [payload.phone ?? null, payload.address ?? null, payload.city ?? null, id]
  );
  return getCustomerById(id);
};

export const deleteCustomer = async (id: number): Promise<boolean> => {
  const [result] = await query<any>(`DELETE FROM user WHERE user_id = ? AND role IN ('CUSTOMER','USER')`, [id]);
  return (result as any)?.affectedRows > 0;
};
