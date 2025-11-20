import { query } from "../../src/lib/db";

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  topProducts: Array<{ id: number; name: string; sold: number }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [totals] = await query<any[]>(
    `SELECT 
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS orders
     FROM \`order\``
  );

  const [customerRows] = await query<any[]>(`SELECT COUNT(*) AS cnt FROM customer`);

  const topProducts = await query<any[]>(
    `SELECT 
        od.product_id AS id,
        p.name,
        SUM(od.quantity) AS sold
     FROM order_detail od
     JOIN product p ON p.product_id = od.product_id
     GROUP BY od.product_id, p.name
     ORDER BY sold DESC
     LIMIT 5`
  );

  return {
    totalRevenue: Number((totals as any).revenue ?? 0),
    totalOrders: Number((totals as any).orders ?? 0),
    totalCustomers: Number((customerRows as any).cnt ?? 0),
    topProducts: topProducts.map((p) => ({
      id: Number(p.id),
      name: p.name,
      sold: Number(p.sold ?? 0),
    })),
  };
}

export async function getRecentOrders(limit = 5) {
  const rows = await query<any[]>(
    `SELECT 
        o.order_id AS id,
        o.total_amount AS total,
        o.order_date AS createdAt,
        LOWER(o.status) AS status,
        u.name AS customer,
        u.email
     FROM \`order\` o
     LEFT JOIN customer c ON c.customer_id = o.customer_id
     LEFT JOIN user u ON u.user_id = c.user_id
     ORDER BY o.order_date DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    total: Number(r.total ?? 0),
    createdAt: r.createdAt,
    status: r.status,
    customer: r.customer ?? "Khách",
    email: r.email ?? "",
  }));
}

export async function getRecentCustomers(limit = 5) {
  // Nếu không có created_at trên bảng customer/user, dùng order gần nhất làm mốc
  const rows = await query<any[]>(
    `SELECT 
        u.user_id AS id,
        u.name,
        u.email,
        u.city,
        MAX(o.order_date) AS lastOrder
     FROM user u
     LEFT JOIN customer c ON c.user_id = u.user_id
     LEFT JOIN \`order\` o ON o.customer_id = c.customer_id
     WHERE u.role IN ('CUSTOMER','USER')
     GROUP BY u.user_id, u.name, u.email, u.city
     ORDER BY lastOrder DESC NULLS LAST, u.user_id DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name ?? "Khách",
    email: r.email ?? "",
    city: r.city ?? "",
    lastOrder: r.lastOrder,
  }));
}
