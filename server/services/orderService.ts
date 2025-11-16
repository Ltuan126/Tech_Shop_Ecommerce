// Placeholder order service. Replace with real DB queries.
export interface OrderRecord {
  id: number;
  customerId: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

export async function listOrders(): Promise<OrderRecord[]> {
  return [];
}

export async function getOrderById(_id: number): Promise<OrderRecord | null> {
  return null;
}

export async function createOrder(): Promise<OrderRecord> {
  throw new Error("createOrder not implemented");
}

export async function updateOrderStatus(): Promise<void> {
  throw new Error("updateOrderStatus not implemented");
}
