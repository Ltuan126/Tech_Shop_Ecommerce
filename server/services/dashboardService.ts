// Placeholder implementations for dashboard metrics.
export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  topProducts: Array<{ id: number; name: string; sold: number }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    topProducts: [],
  };
}

export async function getRecentOrders(limit = 5) {
  return [];
}

export async function getRecentCustomers(limit = 5) {
  return [];
}
