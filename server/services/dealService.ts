import type { ProductWithCategory } from "./productService";
import { listProducts } from "./productService";

export interface DealRecord extends ProductWithCategory {
  discountPercent: number;
}

export async function listDeals(limit = 8): Promise<DealRecord[]> {
  // Get all products without filters to find deals
  const products = await listProducts({});

  const deals = products
    .filter((product) => product.original_price && product.original_price > product.price)
    .map((product) => ({
      ...product,
      discountPercent: Math.round(((product.original_price! - product.price) / product.original_price!) * 100),
    }))
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limit);

  return deals;
}
