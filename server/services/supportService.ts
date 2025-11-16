import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../../src/lib/db";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  topic?: string;
  orderId?: number;
}

export async function submitSupportRequest(payload: ContactPayload) {
  if (!payload.name || !payload.email || !payload.message) {
    throw new Error("Thi?u thông tin liên h? b?t bu?c");
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO support_requests (name, email, message, topic, order_id)
     VALUES (?, ?, ?, ?, ?)`,
    [payload.name, payload.email, payload.message, payload.topic ?? null, payload.orderId ?? null]
  );

  return { success: true, ticketId: result.insertId };
}
