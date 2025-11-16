import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Product } from "./ProductCard";

export interface CartItem extends Product {
  quantity: number;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

// Format number to VND currency
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 1250000; // 1,250,000 VND
  const shippingFee = 250000; // 250,000 VND
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal + shipping;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Giỏ hàng ({items.length})</SheetTitle>
          <SheetDescription>
            Xem lại và quản lý sản phẩm trong giỏ hàng trước khi thanh toán
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl mb-2">Giỏ hàng trống</h3>
              <p className="text-gray-500 mb-6">Thêm sản phẩm để bắt đầu mua sắm</p>
              <Button onClick={onClose} size="lg">
                Tiếp tục mua hàng
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 px-6">
              <div className="space-y-3">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-2">
                              <h4 className="line-clamp-2 mb-1">{item.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 -mt-1 -mr-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-white"
                                onClick={() =>
                                  onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center select-none">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-white"
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {formatVND(item.price)} × {item.quantity}
                              </div>
                              <div className="text-lg">{formatVND(itemTotal)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-6 bg-gray-50 px-6 pb-6">
              <div className="space-y-4">
                {subtotal > 0 && subtotal < freeShippingThreshold && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Tiến độ miễn phí vận chuyển</span>
                      <span className="text-sm">{formatVND(subtotal)} / {formatVND(freeShippingThreshold)}</span>
                    </div>
                    <Progress value={(subtotal / freeShippingThreshold) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-blue-700">
                      Thêm {formatVND(freeShippingThreshold - subtotal)} để được miễn phí vận chuyển! 🎉
                    </p>
                  </div>
                )}

                {shipping === 0 && subtotal > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white">✓</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Bạn đã được miễn phí vận chuyển!
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vận chuyển</span>
                    <span className={shipping === 0 ? "text-green-600" : ""}>
                      {shipping === 0 ? "MIỄN PHÍ" : formatVND(shipping)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Tổng cộng</span>
                    <span className="text-3xl">{formatVND(total)}</span>
                  </div>
                </div>

                <Button className="w-full shadow-lg" size="lg" onClick={onCheckout}>
                  Thanh toán
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}