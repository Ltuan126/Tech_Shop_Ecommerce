import prisma from "../configs/prisma";

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

export async function previewCart(items: CartItemInput[]): Promise<CartPreview> {
  let subtotal = 0;
  const resultItems: Array<CartItemInput & { price: number; name: string }> = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, price: true, stock: true }
    });

    if (!product) {
      throw new Error(`Product ${item.productId} không tồn tại`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho`);
    }

    subtotal += product.price * item.quantity;

    resultItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      name: product.name
    });
  }

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
