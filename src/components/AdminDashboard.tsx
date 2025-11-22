import { useEffect, useState } from "react";
import type React from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Eye,
} from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "./ProductCard";

interface AdminDashboardProps {
  onLogout: () => void;
  userEmail: string;
  products: Product[];
  authToken?: string | null;
}

type AdminView = "overview" | "products" | "orders" | "customers" | "settings";

interface Order {
  id: number;
  customer: string;
  email: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  items: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
}

const statusOptions: Array<{ value: Order["status"]; label: string }> = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "cancelled", label: "Đã hủy" },
];

function StatusSelect({
  value,
  onChange,
  renderBadge,
}: {
  value: Order["status"];
  onChange: (status: Order["status"]) => void | Promise<void>;
  renderBadge: (status: Order["status"]) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {renderBadge(value)}
      <select
        className="text-sm border rounded px-2 py-1 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value as Order["status"])}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminDashboard({ onLogout, userEmail, products, authToken }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productList, setProductList] = useState<any[]>(products || []);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
        const [orderResp, customerResp, productResp] = await Promise.all([
          fetch("/api/orders", { headers }),
          fetch("/api/customers", { headers }),
          fetch("/api/products", { headers }),
        ]);
        const orderJson = await orderResp.json().catch(() => []);
        const customerJson = await customerResp.json().catch(() => []);
        const productsJson = await productResp.json().catch(() => []);

        if (orderResp.ok) {
          setOrders(
            Array.isArray(orderJson)
              ? orderJson.map((o: any) => ({
                  id: o.id ?? o.order_id ?? 0,
                  customer: o.customer ?? o.customerName ?? "Khách",
                  email: o.email ?? "",
                  total: Number(o.total ?? o.total_amount ?? 0),
                  status: (o.status ?? "pending") as Order["status"],
                  date: o.createdAt ?? o.order_date ?? o.created_at ?? new Date().toISOString(),
                  items: Number(o.itemCount ?? o.item_count ?? (o.items?.length ?? 0)),
                }))
              : []
          );
        }

        if (customerResp.ok) {
          setCustomers(
            Array.isArray(customerJson)
              ? customerJson.map((c: any) => ({
                  id: c.id ?? c.user_id ?? 0,
                  name: c.name ?? "Khách",
                  email: c.email ?? "",
                  orders: Number(c.orderCount ?? c.orders ?? 0),
                  spent: Number(c.totalSpent ?? c.spent ?? 0),
                  joined: c.joined ?? new Date().toISOString(),
                }))
              : []
          );
        
        if (productResp.ok) {
          setProductList(Array.isArray(productsJson) ? productsJson : []);
        }
}
      } catch (err) {
        console.warn("[AdminDashboard] loadData failed", err);
      }
    }
    loadData();
  }, [authToken]);

  const refreshProducts = async () => {
    try {
      const resp = await fetch("/api/products", {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const data = await resp.json().catch(() => []);
      if (resp.ok && Array.isArray(data)) {
        setProductList(data);
      }
    } catch (err) {
      console.warn('refreshProducts error', err);
    }
  };


  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] ?? colors.pending;
  };

  const getStatusText = (status: Order["status"]) => {
    const texts = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };
    return texts[status] ?? status;
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = productList.length;
  const totalCustomers = customers.length;
  const filteredProducts = productList.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category_name || p.category || '').toLowerCase().includes(q)
    );
  });


  const menuItems = [
    { id: "overview" as AdminView, icon: LayoutDashboard, label: "Tổng quan" },
    { id: "products" as AdminView, icon: Package, label: "Sản phẩm" },
    { id: "orders" as AdminView, icon: ShoppingCart, label: "Đơn hàng" },
    { id: "customers" as AdminView, icon: Users, label: "Khách hàng" },
    { id: "settings" as AdminView, icon: Settings, label: "Cài đặt" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen fixed left-0 top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">Admin Panel</h1>
              <p className="text-xs text-gray-500">TechStore</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Đang đăng nhập với</p>
            <p className="text-sm truncate">{userEmail}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Overview */}
        {currentView === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Tổng quan</h2>
              <p className="text-gray-600">Chào mừng trở lại, Admin!</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">+12.5%</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-1">Doanh thu</p>
                <p className="text-2xl">{formatVND(totalRevenue)}</p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">+8.2%</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-1">Đơn hàng</p>
                <p className="text-2xl">{totalOrders}</p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Sản phẩm</p>
                <p className="text-2xl">{totalProducts}</p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Khách hàng</p>
                <p className="text-2xl">{totalCustomers}</p>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <h3 className="text-xl mb-4">Đơn hàng gần đây</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Mã đơn</th>
                      <th className="text-left py-3 px-4">Khách hàng</th>
                      <th className="text-left py-3 px-4">Ngày</th>
                      <th className="text-left py-3 px-4">Tổng tiền</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={5}>
                          Chưa có đơn hàng nào
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono">#{order.id}</td>
                          <td className="py-3 px-4">{order.customer}</td>
                          <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("vi-VN")}</td>
                          <td className="py-3 px-4">{formatVND(order.total)}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Products */}
        {currentView === "products" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl mb-2">Quan ly san pham</h2>
                <p className="text-gray-600">Tong {productList.length} san pham</p>
              </div>
              <Button className="gap-2" onClick={() => { setEditingProduct(null); setShowProductForm(true); }}>
                <Plus className="w-4 h-4" />
                Them san pham
              </Button>
            </div>

            <Card className="p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Tim kiem san pham..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {(filteredProducts.length === 0 ? productList : filteredProducts).map((product) => (
                <Card key={product.id || product.product_id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-6">
                    <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category_name || product.category}</p>
                        </div>
                        <Badge className={product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {product.stock > 0 ? "Con hang" : "Het hang"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Gia ban</p>
                          <p className="text-lg">{formatVND(product.price)}</p>
                        </div>
                        {product.original_price || product.originalPrice ? (
                          <div>
                            <p className="text-sm text-gray-500">Gia goc</p>
                            <p className="text-lg line-through text-gray-400">{formatVND(product.original_price || product.originalPrice)}</p>
                          </div>
                        ) : null}
                        <div>
                          <p className="text-sm text-gray-500">Tồn kho</p>
                          <p className="text-lg">{product.stock ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Sua
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Xem
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (!window.confirm("Xoa san pham nay?")) return;
                            try {
                              const resp = await fetch(`/api/products/${product.id || product.product_id}`, {
                                method: "DELETE",
                                headers: {
                                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                                },
                              });
                              const data = await resp.json().catch(() => ({}));
                              if (!resp.ok) throw new Error(data?.message || "Xoa that bai");
                              setProductList((prev) => prev.filter((p) => (p.id || p.product_id) !== (product.id || product.product_id)));
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Khong the xoa");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xoa
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {showProductForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl">{editingProduct ? "Sua san pham" : "Them san pham"}</h3>
                    <Button variant="ghost" onClick={() => setShowProductForm(false)}>
                      Dong
                    </Button>
                  </div>
                  <ProductForm
                    product={editingProduct}
                    onCancel={() => setShowProductForm(false)}
                    onSaved={(p) => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      if (p?.id || p?.product_id) {
                        setProductList((prev) => {
                          const pid = p.id || p.product_id;
                          const exists = prev.some((it) => (it.id || it.product_id) === pid);
                          return exists
                            ? prev.map((it) => ((it.id || it.product_id) === pid ? p : it))
                            : [p, ...prev];
                        });
                      } else {
                        refreshProducts();
                      }
                    }}
                    authToken={authToken}
                  />
                </Card>
              </div>
            )}
            {detailProduct && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Thong tin san pham</h3>
                      <p className="text-sm text-gray-500">{detailProduct.name}</p>
                    </div>
                    <Button variant="ghost" onClick={() => setDetailProduct(null)}>
                      Dong
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="w-full flex justify-center">
                      {detailProduct.image && (
                        <div className="bg-gray-50 border rounded-lg p-2 w-full max-w-sm">
                          <img
                            src={detailProduct.image}
                            alt={detailProduct.name}
                            className="h-64 w-full object-contain rounded mx-auto"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="text-lg font-semibold break-words">{detailProduct.name}</p>
                      <p>
                        Gia ban: <span className="font-medium">{formatVND(detailProduct.price || 0)}</span>
                      </p>
                      {(detailProduct.original_price || detailProduct.originalPrice) && (
                        <p>Gia goc: {formatVND(detailProduct.original_price || detailProduct.originalPrice || 0)}</p>
                      )}
                      <p>Ton kho: {detailProduct.stock ?? 0}</p>
                      <p>Category: {detailProduct.category_name || detailProduct.category || "-"}</p>
                      <p>Brand ID: {detailProduct.brand_id || detailProduct.brandId || "-"}</p>
                      <p>Status: {detailProduct.status || "-"}</p>
                    </div>
                  </div>
                  {detailProduct.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Mô tả</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{detailProduct.description}</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </motion.div>
        )}

{/* Orders */}
        {currentView === "orders" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Quản lý đơn hàng</h2>
              <p className="text-gray-600">Tổng {orders.length} đơn hàng</p>
            </div>

            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Mã đơn</th>
                      <th className="text-left py-3 px-4">Khách hàng</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Ngày</th>
                      <th className="text-left py-3 px-4">Số lượng</th>
                      <th className="text-left py-3 px-4">Tổng tiền</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={8}>
                          Chưa có đơn hàng nào
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono">#{order.id}</td>
                          <td className="py-3 px-4">{order.customer}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{order.email}</td>
                          <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("vi-VN")}</td>
                          <td className="py-3 px-4">{order.items} sản phẩm</td>
                          <td className="py-3 px-4">{formatVND(order.total)}</td>
                          <td className="py-3 px-4">
                            <StatusSelect
                              value={order.status}
                              onChange={async (next) => {
                                try {
                                  const resp = await fetch(`/api/orders/${order.id}/status`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                                    },
                                    body: JSON.stringify({ status: next }),
                                  });
                                  const data = await resp.json().catch(() => ({}));
                                  if (!resp.ok) throw new Error(data?.message || "Không thể cập nhật trạng thái");
                                  setOrders((prev) =>
                                    prev.map((o) => (o.id === order.id ? { ...o, status: next as Order["status"] } : o))
                                  );
                                } catch (err) {
                                  console.error("Update status failed", err);
                                  alert(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
                                }
                              }}
                              renderBadge={(status) => (
                                <Badge className={getStatusColor(status as Order["status"])}>
                                  {getStatusText(status as Order["status"])}
                                </Badge>
                              )}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Customers */}
        {currentView === "customers" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Quản lý khách hàng</h2>
              <p className="text-gray-600">Tổng {customers.length} khách hàng</p>
            </div>

            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Tên khách hàng</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Số đơn</th>
                      <th className="text-left py-3 px-4">Tổng chi tiêu</th>
                      <th className="text-left py-3 px-4">Ngày tham gia</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={7}>
                          Chưa có khách hàng nào
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">#{customer.id}</td>
                          <td className="py-3 px-4">{customer.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                          <td className="py-3 px-4">{customer.orders} đơn</td>
                          <td className="py-3 px-4">{formatVND(customer.spent)}</td>
                          <td className="py-3 px-4">
                            {new Date(customer.joined).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        {currentView === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Cài đặt</h2>
              <p className="text-gray-600">Quản lý cấu hình hệ thống</p>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl mb-4">Thông tin cửa hàng</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Tên cửa hàng</Label>
                    <Input defaultValue="TechStore" />
                  </div>
                  <div>
                    <Label>Email liên hệ</Label>
                    <Input defaultValue="support@techstore.vn" />
                  </div>
                  <div>
                    <Label>Số điện thoại</Label>
                    <Input defaultValue="1900 1234" />
                  </div>
                  <div>
                    <Label>Địa chỉ</Label>
                    <Input defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl mb-4">Cài đặt vận chuyển</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Phí vận chuyển mặc định (₫)</Label>
                    <Input type="number" defaultValue="50000" />
                  </div>
                  <div>
                    <Label>Miễn phí vận chuyển từ (₫)</Label>
                    <Input type="number" defaultValue="1250000" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl mb-4">Cài đặt thanh toán</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked />
                    <span>Chuyển khoản ngân hàng</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" />
                    <span>Thanh toán thẻ tín dụng</span>
                  </label>
                </div>
              </Card>

              <Button className="w-full" size="lg">
                Lưu thay đổi
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}


function ProductForm({
  product,
  onCancel,
  onSaved,
  authToken,
}: {
  product: any | null;
  onCancel: () => void;
  onSaved: (p: any) => void;
  authToken?: string | null;
}) {
  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price || 0,
    original_price: product?.original_price || product?.originalPrice || "",
    stock: product?.stock || 0,
    category_id: product?.category_id || product?.categoryId || 1,
    brand_id: product?.brand_id || product?.brandId || 1,
    status: product?.status || "ACTIVE",
    image: product?.image || "",
    description: product?.description || "",
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      alert("Can dang nhap admin");
      return;
    }
    if (!form.category_id || form.category_id <= 0) {
      alert("Vui long chon category_id hop le (VD: 1, 2, 3)");
      return;
    }
    if (!form.brand_id || form.brand_id <= 0) {
      alert("Vui long chon brand_id hop le (VD: 1, 2, 3)");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!product?.id || !!product?.product_id;
      const pid = product?.id || product?.product_id;
      const url = isEdit ? `/api/products/${pid}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.message || "Luu that bai");
      onSaved(data);
    } catch (err: any) {
      alert(err?.message || "Khong the luu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Ten san pham</Label>
          <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
        </div>
        <div>
          <Label>Gia ban</Label>
          <Input
            type="number"
            value={form.price}
            onChange={(e) => updateField("price", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label>Gia goc</Label>
          <Input
            type="number"
            value={form.original_price}
            onChange={(e) => updateField("original_price", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Tồn kho</Label>
          <Input
            type="number"
            value={form.stock}
            onChange={(e) => updateField("stock", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label>Category ID</Label>
          <Input
            type="number"
            value={form.category_id}
            onChange={(e) => updateField("category_id", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label>Brand ID</Label>
          <Input
            type="number"
            value={form.brand_id}
            onChange={(e) => updateField("brand_id", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label>Status</Label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
          </select>
        </div>
        <div>
          <Label>Image URL</Label>
          <Input value={form.image} onChange={(e) => updateField("image", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Mô tả</Label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huy
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Dang luu..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}
