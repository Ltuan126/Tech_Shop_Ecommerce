// Placeholder cart/checkout helpers.
export interface CartItemInput {
  productId: number;
  quantity: number;
}

export interface CartPreview {
  items: Array<CartItemInput & { price: number; name: string }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export async function previewCart(_items: CartItemInput[]): Promise<CartPreview> {
  return {
    items: [],
    subtotal: 0,
    shippingFee: 0,
    discount: 0,
    total: 0,
  };
}
