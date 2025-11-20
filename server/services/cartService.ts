import { query } from "../../src/lib/db";

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

interface ProductRow {
  product_id: number;
  name: string;
  price: number;
  stock: number;
}

export async function previewCart(items: CartItemInput[]): Promise<CartPreview> {
  let subtotal = 0;
  const resultItems: Array<CartItemInput & { price: number; name: string }> = [];

  for (const item of items) {
    // Validate input
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      throw new Error("productId và quantity phải là số dương hợp lệ");
    }

    // Query product từ database
    const rows = await query<ProductRow[]>(
      `SELECT product_id, name, price, stock
       FROM product
       WHERE product_id = ?
       LIMIT 1`,
      [item.productId]
    );

    const product = rows[0];

    if (!product) {
      throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock})`);
    }

    // Tính subtotal
    const itemTotal = Number(product.price) * item.quantity;
    subtotal += itemTotal;

    resultItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: Number(product.price),
      name: product.name
    });
  }

  // Fixed shipping fee
  const shippingFee = 30000;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  return {
    items: resultItems,
    subtotal,
    shippingFee,
    discount,
    total
  };
}
