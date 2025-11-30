import { pool, query } from "../../src/lib/db";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderRecord {
  id: number;
  customerId: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  paymentStatus?: string | null;
  itemCount?: number;
  customerName?: string;
  email?: string;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  userId: number;
  items: OrderItemInput[];
  shippingAddress: string;
  paymentMethod: "COD" | "BANK" | "WALLET";
  couponCode?: string;
}

export interface OrderDetail {
  id: number;
  customerName: string | null;
  email: string;
  status: OrderStatus;
  total: number;
  paymentStatus?: string | null;
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
  subtotal?: number;
  shippingFee?: number;
  discountTotal?: number;
  items: Array<{
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image?: string;
  }>;
}

export async function listOrders(): Promise<OrderRecord[]> {
  let rows: any[] = [];
  try {
    rows = await query<any[]>(`
      SELECT
        o.order_id AS id,
        o.customer_id AS customerId,
        o.total_amount AS total,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        o.payment_status AS paymentStatus,
        (SELECT COALESCE(SUM(od.quantity),0) FROM order_detail od WHERE od.order_id = o.order_id) AS itemCount,
        u.name AS customerName,
        u.email
      FROM \`order\` o
      LEFT JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN user u ON u.user_id = c.user_id
      ORDER BY o.order_date DESC
    `);
  } catch {
    rows = await query<any[]>(`
      SELECT
        o.order_id AS id,
        o.customer_id AS customerId,
        o.total_amount AS total,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        (SELECT COALESCE(SUM(od.quantity),0) FROM order_detail od WHERE od.order_id = o.order_id) AS itemCount,
        u.name AS customerName,
        u.email
      FROM \`order\` o
      LEFT JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN user u ON u.user_id = c.user_id
      ORDER BY o.order_date DESC
    `);
  }
  return rows.map((r) => ({
    id: Number(r.id),
    customerId: Number(r.customerId),
    total: Number(r.total ?? 0),
    status: (r.status as OrderStatus) ?? "pending",
    createdAt: r.createdAt,
    paymentStatus: r.paymentStatus,
    itemCount: Number(r.itemCount ?? 0),
    customerName: r.customerName ?? "Khách",
    email: r.email ?? "",
  }));
}

export async function listOrdersByUser(userId: number): Promise<OrderRecord[]> {
  let rows: any[] = [];
  try {
    rows = await query<any[]>(
      `
      SELECT 
        o.order_id AS id,
        o.customer_id AS customerId,
        o.total_amount AS total,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        o.payment_status AS paymentStatus,
        (SELECT COALESCE(SUM(od.quantity),0) FROM order_detail od WHERE od.order_id = o.order_id) AS itemCount
      FROM \`order\` o
      JOIN customer c ON c.customer_id = o.customer_id
      WHERE c.user_id = ?
      ORDER BY o.order_date DESC
    `,
      [userId]
    );
  } catch {
    rows = await query<any[]>(
      `
      SELECT 
        o.order_id AS id,
        o.customer_id AS customerId,
        o.total_amount AS total,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        (SELECT COALESCE(SUM(od.quantity),0) FROM order_detail od WHERE od.order_id = o.order_id) AS itemCount
      FROM \`order\` o
      JOIN customer c ON c.customer_id = o.customer_id
      WHERE c.user_id = ?
      ORDER BY o.order_date DESC
    `,
      [userId]
    );
  }
  return rows.map((r) => ({
    id: Number(r.id),
    customerId: Number(r.customerId),
    total: Number(r.total ?? 0),
    status: (r.status as OrderStatus) ?? "pending",
    createdAt: r.createdAt,
    paymentStatus: r.paymentStatus,
    itemCount: Number(r.itemCount ?? 0),
  }));
}

export async function getOrderById(id: number): Promise<OrderDetail | null> {
  let rows: any[] = [];
  try {
    rows = await query<any[]>(
      `
      SELECT
        o.order_id AS id,
        o.customer_id,
        o.total_amount AS total,
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.discount_total AS discountTotal,
        o.shipping_address AS shippingAddress,
        o.payment_method AS paymentMethod,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        o.payment_status AS paymentStatus,
        (SELECT COALESCE(SUM(od.quantity),0) FROM order_detail od WHERE od.order_id = o.order_id) AS itemCount,
        u.name AS customerName,
        u.email
      FROM \`order\` o
      LEFT JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN user u ON u.user_id = c.user_id
      WHERE o.order_id = ?
      LIMIT 1
    `,
      [id]
    );
  } catch {
    rows = await query<any[]>(
      `
      SELECT
        o.order_id AS id,
        o.customer_id,
        o.total_amount AS total,
        o.shipping_address AS shippingAddress,
        o.payment_method AS paymentMethod,
        LOWER(o.status) AS status,
        o.order_date AS createdAt,
        u.name AS customerName,
        u.email
      FROM \`order\` o
      LEFT JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN user u ON u.user_id = c.user_id
      WHERE o.order_id = ?
      LIMIT 1
    `,
      [id]
    );
  }

  if (!rows[0]) return null;

  const items = await query<any[]>(
    `
    SELECT od.product_id AS productId,
           od.quantity,
           od.unit_price AS unitPrice,
           (od.quantity * od.unit_price) AS lineTotal,
           p.name,
           p.image
    FROM order_detail od
    LEFT JOIN product p ON p.product_id = od.product_id
    WHERE od.order_id = ?
  `,
    [id]
  );

  return {
    id: Number(rows[0].id),
    customerName: rows[0].customerName ?? null,
    email: rows[0].email ?? "",
    status: (rows[0].status as OrderStatus) ?? "pending",
    total: Number(rows[0].total ?? 0),
    subtotal: Number(rows[0].subtotal ?? rows[0].total ?? 0),
    shippingFee: Number(rows[0].shippingFee ?? 0),
    discountTotal: Number(rows[0].discountTotal ?? 0),
    shippingAddress: rows[0].shippingAddress ?? "",
    paymentMethod: rows[0].paymentMethod ?? "COD",
    paymentStatus: rows[0].paymentStatus ?? null,
    createdAt: rows[0].createdAt,
    items: items.map((i) => ({
      productId: Number(i.productId),
      name: i.name ?? "Sản phẩm",
      quantity: Number(i.quantity ?? 0),
      unitPrice: Number(i.unitPrice ?? 0),
      lineTotal: Number(i.lineTotal ?? 0),
      image: i.image ?? "",
    })),
  };
}

async function getOrCreateCustomerId(userId: number, conn: any): Promise<number> {
  // Try existing
  const [existing] = await conn.execute(
    `SELECT customer_id FROM customer WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  const rows = existing as any[];
  if (rows?.[0]?.customer_id) return Number(rows[0].customer_id);

  // Create new
  const [result] = await conn.execute(
    `INSERT INTO customer (user_id, phone, address, city) VALUES (?, NULL, NULL, NULL)`,
    [userId]
  );
  return Number((result as any).insertId);
}

async function maybeApplyCoupon(
  conn: any,
  couponCode: string | undefined,
  userId: number,
  subtotal: number,
  orderId: number
): Promise<number> {
  if (!couponCode) return 0;

  try {
    const [rows] = await conn.execute(
      `SELECT coupon_id, type, value, max_discount, min_order, usage_limit, used_count, start_at, end_at, status 
       FROM coupon WHERE code = ? LIMIT 1`,
      [couponCode]
    );
    const coupon = (rows as any[])[0];
    if (!coupon) return 0;

    const now = new Date();
    const start = coupon.start_at ? new Date(coupon.start_at) : null;
    const end = coupon.end_at ? new Date(coupon.end_at) : null;

    const status = String(coupon.status ?? "").toLowerCase();
    if (status !== "active") return 0;

    const type = String(coupon.type ?? "").toLowerCase();

    if (start && now < start) return 0;
    if (end && now > end) return 0;
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return 0;
    if (coupon.min_order && subtotal < Number(coupon.min_order)) return 0;

    let discount = 0;
    if (type === "percent") {
      discount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
    } else {
      discount = Number(coupon.value ?? 0);
    }
    discount = Math.max(0, Math.min(discount, subtotal));

    // mark usage and redemption
    await conn.execute(`UPDATE coupon SET used_count = used_count + 1 WHERE coupon_id = ?`, [
      coupon.coupon_id,
    ]);
    await conn.execute(
      `INSERT INTO coupon_redemption (coupon_id, user_id, order_id, discount_amount, used_at) VALUES (?, ?, ?, ?, NOW())`,
      [coupon.coupon_id, userId, orderId, discount]
    );

    return discount;
  } catch (err) {
    console.warn("[coupon] skip coupon apply due to error:", err);
    return 0;
  }
}

async function logStatus(conn: any, orderId: number, toStatus: string) {
  try {
    await conn.execute(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
       VALUES (?, NULL, ?, NULL, ?, NOW())`,
      [orderId, toStatus, "Khởi tạo đơn"]
    );
  } catch (err) {
    console.warn("[order_status_history] skip log", err);
  }
}

async function logInventory(conn: any, productId: number, qty: number, orderId: number) {
  try {
    await conn.execute(
      `INSERT INTO inventory_log (product_id, change_qty, reason, reference_id, note, created_at)
       VALUES (?, ?, 'order', ?, ?, NOW())`,
      [productId, -Math.abs(qty), orderId, "Trừ kho khi tạo đơn"]
    );
  } catch (err) {
    console.warn("[inventory_log] skip log", err);
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDetail> {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Danh sách sản phẩm trống");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const productIds = payload.items.map((i) => i.productId);
    const placeholders = productIds.map(() => "?").join(",");
    const [rows] = await conn.execute(
      `SELECT product_id, name, price, stock FROM product WHERE product_id IN (${placeholders}) FOR UPDATE`,
      productIds
    );
    const products = rows as any[];

    let subtotal = 0;
    const validatedItems = payload.items.map((item) => {
      const found = products.find((p) => Number(p.product_id) === item.productId);
      if (!found) {
        throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
      }
      if (Number(found.stock) < item.quantity) {
        throw new Error(`Sản phẩm "${found.name}" không đủ tồn kho`);
      }
      const price = Number(found.price);
      subtotal += price * item.quantity;
      return { ...item, name: found.name, price };
    });

    // Match frontend: free ship nếu đủ ngưỡng, otherwise 50k
    const freeShippingThreshold = 1250000;
    const shippingFee = subtotal >= freeShippingThreshold ? 0 : 50000;

    // create order skeleton first to get id
    const customerId = await getOrCreateCustomerId(payload.userId, conn);
    const [orderInsert] = await conn.execute(
      `INSERT INTO \`order\`
        (customer_id, order_date, total_amount, shipping_address, payment_method, status)
       VALUES (?, NOW(), 0, ?, ?, 'PENDING')`,
      [customerId, payload.shippingAddress, payload.paymentMethod]
    );
    const orderId = Number((orderInsert as any).insertId);

    // Apply coupon if available
    const discount = await maybeApplyCoupon(
      conn,
      payload.couponCode,
      payload.userId,
      subtotal,
      orderId
    );

    const total = subtotal + shippingFee - discount;

    // Insert order details
    for (const item of validatedItems) {
      await conn.execute(
        `INSERT INTO order_detail (order_id, product_id, quantity, unit_price, warranty_snapshot)
         VALUES (?, ?, ?, ?, NULL)`,
        [orderId, item.productId, item.quantity, item.price]
      );
      await conn.execute(
        `UPDATE product SET stock = stock - ? WHERE product_id = ?`,
        [item.quantity, item.productId]
      );
      await logInventory(conn, item.productId, item.quantity, orderId);
    }

    // Update totals and payment info
    try {
      await conn.execute(
        `UPDATE \`order\`
         SET total_amount = ?, subtotal = ?, shipping_fee = ?, discount_total = ?, status = 'PENDING', payment_status = 'PENDING'
         WHERE order_id = ?`,
        [total, subtotal, shippingFee, discount, orderId]
      );
    } catch {
      await conn.execute(
        `UPDATE \`order\`
         SET total_amount = ?, subtotal = ?, shipping_fee = ?, discount_total = ?, status = 'PENDING'
         WHERE order_id = ?`,
        [total, subtotal, shippingFee, discount, orderId]
      );
    }

    await logStatus(conn, orderId, "PENDING");

    await conn.commit();

    return (await getOrderById(orderId)) as OrderDetail;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<void> {
  await query(`UPDATE \`order\` SET status = ? WHERE order_id = ?`, [status.toUpperCase(), orderId]);
}

/**
 * Cập nhật trạng thái đơn và hoàn kho nếu hủy.
 */
export async function setOrderStatus(
  orderId: number,
  status: OrderStatus,
  changedBy?: number
): Promise<void> {
  const target = status.toUpperCase();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT status FROM \`order\` WHERE order_id = ? FOR UPDATE`,
      [orderId]
    );
    const orderRow = (rows as any[])[0];
    if (!orderRow) {
      throw new Error("Order not found");
    }
    const current = (orderRow.status?.toLowerCase?.() || "pending") as OrderStatus;

    // Hoàn kho nếu từ trạng thái khác sang cancelled
    if (current !== "cancelled" && target === "CANCELLED") {
      const [items] = await conn.execute(
        `SELECT product_id, quantity FROM order_detail WHERE order_id = ?`,
        [orderId]
      );
      for (const it of items as any[]) {
        const qty = Number(it.quantity ?? 0);
        if (qty > 0) {
          await conn.execute(
            `UPDATE product SET stock = stock + ? WHERE product_id = ?`,
            [qty, it.product_id]
          );
          await logInventory(conn, Number(it.product_id), -qty, orderId);
        }
      }
    }

    await conn.execute(
      `UPDATE \`order\` SET status = ? WHERE order_id = ?`,
      [target, orderId]
    );

    try {
      await conn.execute(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [orderId, current?.toUpperCase?.() ?? null, target, changedBy ?? null, "Cập nhật trạng thái"]
      );
    } catch (err) {
      console.warn("[order_status_history] skip log", err);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
