// Placeholder customer service for future DB work.
export interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  return [];
}

export async function getCustomerById(_id: number): Promise<CustomerRecord | null> {
  return null;
}
