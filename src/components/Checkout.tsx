import { useState } from "react";
import { ArrowLeft, CreditCard, Truck } from "lucide-react";
import type { CartItem } from "./ShoppingCart";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";

interface CheckoutProps {
  items: CartItem[];
  onBack: () => void;
  onComplete: (order?: any) => void;
  authToken?: string | null;
}

export function Checkout({ items, onBack, onComplete, authToken }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
  });

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 1250000;
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 50000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      alert("Vui long dang nhap truoc khi dat hang.");
      return;
    }
    if (!formData.fullName || !formData.phone || !formData.address) {
      alert("Vui long dien day du thong tin bat buoc.");
      return;
    }

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: `${formData.address}, ${formData.ward || ""}, ${formData.district || ""}, ${
          formData.city || ""
        }`.replace(/,\s*,/g, ","),
        paymentMethod: paymentMethod.toUpperCase(),
        note: formData.note,
      };

      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error?.message || "Khong the tao don hang");
      }

      const order = await resp.json().catch(() => null);
      onComplete(order);
    } catch (err: any) {
      alert(err?.message || "Khong the tao don hang");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lai gio hang
        </Button>

        <h1 className="text-3xl mb-8">Thanh toan</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl">Thong tin giao hang</h2>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Ho va ten <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Nguyen Van A"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      So dien thoai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Dia chi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="So nha, ten duong"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Tinh/Thanh pho</Label>
                    <Input
                      id="city"
                      placeholder="TP. Ho Chi Minh"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">Quan/Huyen</Label>
                    <Input
                      id="district"
                      placeholder="Quan 1"
                      value={formData.district}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Phuong/Xa</Label>
                    <Input
                      id="ward"
                      placeholder="Phuong Ben Nghe"
                      value={formData.ward}
                      onChange={(e) => handleInputChange("ward", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chu (tuy chon)</Label>
                  <textarea
                    id="note"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ghi chu ve don hang, vi du: giao gio hanh chinh"
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                  />
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl">Phuong thuc thanh toan</h2>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="cod" id="cod" className="mt-1" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Thanh toan khi nhan hang (COD)</span>
                      </div>
                      <p className="text-sm text-gray-600">Thanh toan tien mat khi nhan hang</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="bank" id="bank" className="mt-1" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Chuyen khoan ngan hang</span>
                      </div>
                      <p className="text-sm text-gray-600">Chuyen khoan qua Internet Banking hoac QR Code</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer opacity-50">
                    <RadioGroupItem value="card" id="card" disabled className="mt-1" />
                    <Label htmlFor="card" className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">The tin dung/ghi no</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">Sap ra mat</span>
                      </div>
                      <p className="text-sm text-gray-600">Visa, Mastercard, JCB</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {paymentMethod === "bank" && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm mb-2">Thong tin chuyen khoan:</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Ngan hang:</strong> Vietcombank
                    </p>
                    <p>
                      <strong>So tai khoan:</strong> 1234567890
                    </p>
                    <p>
                      <strong>Chu tai khoan:</strong> CONG TY TECHSTORE
                    </p>
                    <p>
                      <strong>Noi dung:</strong> [Ho ten] [So dien thoai]
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-2xl mb-6">Don hang cua ban</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{item.name}</p>
                      <p className="text-sm mt-1">{formatVND(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tam tinh</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phi van chuyen</span>
                  <span className={shippingFee === 0 ? "text-green-600" : ""}>
                    {shippingFee === 0 ? "MIEN PHI" : formatVND(shippingFee)}
                  </span>
                </div>

                {subtotal > 0 && subtotal < freeShippingThreshold && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    Mua them {formatVND(freeShippingThreshold - subtotal)} de duoc mien phi van chuyen
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg">Tong cong</span>
                  <span className="text-2xl text-blue-600">{formatVND(total)}</span>
                </div>
              </div>

              <Button className="w-full mt-6" size="lg" onClick={handleSubmit}>
                Hoan tat dat hang
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Bang viec dat hang, ban dong y voi{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Dieu khoan dich vu
                </a>{" "}
                cua chung toi
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
