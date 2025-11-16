import type { ProductRecord } from "./productService";
import { listProducts } from "./productService";

export interface DealRecord extends ProductRecord {
  discountPercent: number;
}

export async function listDeals(limit = 8): Promise<DealRecord[]> {
  const { data } = await listProducts({ page: 1, pageSize: limit * 3, inStockOnly: true });

  const deals = data
    .filter((product) => product.originalPrice && product.originalPrice > product.price)
    .map((product) => ({
      ...product,
      discountPercent: Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100),
    }))
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limit);

  return deals;
}
