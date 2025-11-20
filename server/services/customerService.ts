import { query } from "../../src/lib/db";

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
