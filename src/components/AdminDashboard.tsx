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
  X,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "./ProductCard";
import { toast } from "sonner";

interface AdminDashboardProps {
  onLogout: () => void;
  userEmail: string;
  products: Product[];
  authToken?: string | null;
}

type AdminView = "overview" | "products" | "orders" | "customers" | "reviews" | "settings";

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
  role?: string;
  phone?: string;
  address?: string;
  city?: string;
}

interface Review {
  review_id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  is_verified_purchase: boolean;
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
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const normalizeCustomer = (c: any): Customer => ({
    id: c.id ?? c.user_id ?? 0,
    name: c.name ?? "Khách",
    email: c.email ?? "",
    orders: Number(c.orderCount ?? c.orders ?? 0),
    spent: Number(c.totalSpent ?? c.spent ?? 0),
    joined: c.joined ?? new Date().toISOString(),
    role: c.role ?? "CUSTOMER",
    phone: c.phone,
    address: c.address,
    city: c.city,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
        const [orderResp, customerResp, productResp] = await Promise.all([
          fetch("/api/orders", { headers }),
          fetch("/api/customers?includeDisabled=true", { headers }),
          fetch("/api/products", { headers }),
        ]);
        const orderJson = await orderResp.json().catch(() => []);
        const customerJson = await customerResp.json().catch(() => []);
        const productsJson = await productResp.json().catch(() => []);

        if (orderResp.ok) {
          setOrders(
            Array.isArray(orderJson)
              ? orderJson.map((o: any) => {
                  // Map "completed" from database to "delivered" for frontend
                  let status = o.status ?? "pending";
                  if (status === "completed") {
                    status = "delivered";
                  }
                  return {
                    id: o.id ?? o.order_id ?? 0,
                    customer: o.customer ?? o.customerName ?? "Khách",
                    email: o.email ?? "",
                    total: Number(o.total ?? o.total_amount ?? 0),
                    status: status as Order["status"],
                    date: o.createdAt ?? o.order_date ?? o.created_at ?? new Date().toISOString(),
                    items: Number(o.itemCount ?? o.item_count ?? (o.items?.length ?? 0)),
                  };
                })
              : []
          );
        }

        if (customerResp.ok) {
          setCustomers(
            Array.isArray(customerJson)
              ? customerJson.map((c: any) => normalizeCustomer(c))
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

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const resp = await fetch(`/api/orders/${orderId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const data = await resp.json();
      if (resp.ok) {
        setOrderDetails(data);
        setSelectedOrder(orders.find(o => o.id === orderId));
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const loadReviews = async () => {
    try {
      const resp = await fetch('/api/reviews?limit=100', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const data = await resp.json();
      if (resp.ok && data.reviews) {
        setReviews(data.reviews.map((r: any) => ({
          review_id: r.review_id,
          product_id: r.product_id,
          product_name: r.product_name || 'Unknown',
          user_id: r.user_id,
          user_name: r.user_name || 'Unknown',
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          status: r.status,
          created_at: r.created_at,
          is_verified_purchase: r.is_verified_purchase,
        })));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error('Không thể tải danh sách đánh giá');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      const resp = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (resp.ok) {
        toast.success('Đã xóa đánh giá');
        loadReviews();
      } else {
        const error = await resp.json();
        throw new Error(error.error || 'Không thể xóa đánh giá');
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa đánh giá');
    }
  };

  useEffect(() => {
    if (currentView === 'reviews') {
      loadReviews();
    }
  }, [currentView]);


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
    { id: "reviews" as AdminView, icon: Star, label: "Đánh giá" },
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
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-2">
                <Card className="w-full max-w-md p-3 bg-white shadow-xl max-h-[75vh] overflow-y-auto rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold truncate">Thong tin san pham</h3>
                      <p className="text-sm text-gray-500 truncate">{detailProduct.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDetailProduct(null)}>
                      Dong
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 items-start">
                    <div className="w-full flex justify-center">
                      {detailProduct.image && (
                        <div className="bg-gray-50 border rounded-lg p-2 w-full max-w-xs">
                          <img
                            src={detailProduct.image}
                            alt={detailProduct.name}
                            className="max-h-40 w-full object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-sm text-gray-700">
                      <p className="font-semibold break-words">{detailProduct.name}</p>
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
                    <div className="mt-2">
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

            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">Chưa có đơn hàng nào</p>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-2xl font-bold text-blue-600">#{order.id}</span>
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
                                toast.success("Đã cập nhật trạng thái đơn hàng");
                              } catch (err) {
                                console.error("Update status failed", err);
                                toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
                              }
                            }}
                            renderBadge={(status) => (
                              <Badge className={getStatusColor(status as Order["status"])}>
                                {getStatusText(status as Order["status"])}
                              </Badge>
                            )}
                          />
                        </div>

                        {/* Customer Info with Avatar */}
                        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {order.customer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.customer}</p>
                            <p className="text-sm text-gray-600">{order.email}</p>
                          </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Ngày đặt</p>
                            <p className="font-medium">{new Date(order.date).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Số lượng</p>
                            <p className="font-medium">{order.items} sản phẩm</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Tổng tiền</p>
                            <p className="font-bold text-lg text-blue-600">{formatVND(order.total)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Customers */}
        {currentView === "customers" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl mb-2">Quản lý khách hàng</h2>
                <p className="text-gray-600">Tổng {customers.length} khách hàng</p>
              </div>
              <Button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowCustomerForm(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm khách hàng
              </Button>
            </div>

            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Tên khách hàng</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Số đơn</th>
                      <th className="text-left py-3 px-4">Tổng chi tiêu</th>
                      <th className="text-left py-3 px-4">Ngày tham gia</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={8}>
                          Chưa có khách hàng nào
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">#{customer.id}</td>
                          <td className="py-3 px-4">{customer.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                customer.role === "DISABLED"
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {customer.role || "CUSTOMER"}
                            </span>
                          </td>
                          <td className="py-3 px-4">{customer.orders} đơn</td>
                          <td className="py-3 px-4">{formatVND(customer.spent)}</td>
                          <td className="py-3 px-4">
                            {new Date(customer.joined).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setShowCustomerForm(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={customer.role === "DISABLED" ? "outline" : "destructive"}
                                onClick={async () => {
                                  if (customer.role === "DISABLED") {
                                    try {
                                      const res = await fetch(`/api/customers/${customer.id}/restore`, {
                                        method: "PATCH",
                                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                                      });
                                      const data = await res.json().catch(() => ({}));
                                      if (!res.ok) throw new Error(data?.message || "Khôi phục thất bại");
                                      setCustomers((prev) =>
                                        prev.map((c) =>
                                          c.id === customer.id ? { ...c, role: data.role || "CUSTOMER" } : c
                                        )
                                      );
                                      toast.success("Đã khôi phục khách hàng");
                                    } catch (error: any) {
                                      toast.error(error?.message || "Không thể khôi phục");
                                    }
                                    return;
                                  }

                                  if (!confirm(`Xóa khách hàng "${customer.name}"?`)) return;
                                  try {
                                    const res = await fetch(`/api/customers/${customer.id}`, {
                                      method: "DELETE",
                                      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (res.status === 409) {
                                      throw new Error(data?.message || "Khách hàng đã có đơn nên không thể xóa");
                                    }
                                    if (!res.ok) {
                                      throw new Error(data?.message || "Xóa thất bại");
                                    }
                                    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
                                    toast.success("Đã xóa khách hàng");
                                  } catch (error: any) {
                                    toast.error(error?.message || "Không thể xóa khách hàng");
                                  }
                                }}
                              >
                                {customer.role === "DISABLED" ? (
                                  "Khôi phục"
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
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

        {/* Order Details Modal */}
        {orderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Chi tiết đơn hàng #{selectedOrder.id}</h2>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOrderDetails(null);
                      setSelectedOrder(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Customer Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Thông tin khách hàng</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {selectedOrder.customer.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{selectedOrder.customer}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.email}</p>
                    </div>
                  </div>
                  {orderDetails.shippingAddress && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng:</p>
                      <p className="font-medium">{orderDetails.shippingAddress}</p>
                    </div>
                  )}
                  {orderDetails.paymentMethod && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán:</p>
                      <p className="font-medium">
                        {orderDetails.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' :
                         orderDetails.paymentMethod === 'BANK' ? 'Chuyển khoản ngân hàng' :
                         orderDetails.paymentMethod === 'WALLET' ? 'Ví điện tử' : orderDetails.paymentMethod}
                      </p>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Sản phẩm đã đặt</h3>
                  <div className="space-y-3">
                    {orderDetails.items && orderDetails.items.length > 0 ? (
                      orderDetails.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.name || item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Số lượng: {item.quantity} × {formatVND(item.price || item.unit_price)}
                            </p>
                          </div>
                          <p className="font-semibold">{formatVND((item.quantity || 1) * (item.price || item.unit_price || 0))}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Không có thông tin sản phẩm</p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span>{formatVND(orderDetails.subtotal || selectedOrder.total)}</span>
                    </div>
                    {orderDetails.shippingFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phí vận chuyển:</span>
                        <span>{formatVND(orderDetails.shippingFee)}</span>
                      </div>
                    )}
                    {orderDetails.discountTotal > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{formatVND(orderDetails.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{formatVND(selectedOrder.total)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Ngày đặt: {new Date(selectedOrder.date).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reviews */}
        {currentView === "reviews" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Quản lý đánh giá</h2>
              <p className="text-gray-600">Tổng {reviews.length} đánh giá</p>
            </div>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">Chưa có đánh giá nào</p>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.review_id} className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Review Info */}
                      <div className="flex-1">
                        {/* Rating & User */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge className={
                            review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            review.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {review.status === 'APPROVED' ? 'Đã duyệt' :
                             review.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                          </Badge>
                        </div>

                        {/* Product & User Info */}
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Sản phẩm: {review.product_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Người đánh giá: {review.user_name}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>

                        {/* Title */}
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                        )}

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.comment}</p>
                        )}

                        {/* Verified Purchase Badge */}
                        {review.is_verified_purchase && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Đã mua hàng
                          </Badge>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteReview(review.review_id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
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

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer}
          onCancel={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          onSaved={(savedCustomer) => {
            if (editingCustomer) {
              setCustomers((prev) =>
                prev.map((c) => (c.id === savedCustomer.id ? normalizeCustomer(savedCustomer) : c))
              );
            } else {
              setCustomers((prev) => [normalizeCustomer(savedCustomer), ...prev]);
            }
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          authToken={authToken}
        />
      )}
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
    category_id: product?.category_id || product?.categoryId || 0,
    brand_id: product?.brand_id || product?.brandId || 1,
    status: product?.status || "ACTIVE",
    image: product?.image || "",
    description: product?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const resp = await fetch("/api/categories");
        const data = await resp.json().catch(() => []);
        if (!mounted) return;
        if (resp.ok && Array.isArray(data)) {
          setCategories(data);
          // Auto-select the first category when creating a new product
          if (!product && (!form.category_id || form.category_id <= 0) && data.length > 0) {
            setForm((prev) => ({ ...prev, category_id: data[0].category_id }));
          }
        }
      } catch (err) {
        console.warn("[ProductForm] loadCategories failed", err);
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

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
    if (categories.length > 0 && !categories.some((c) => Number(c.category_id) === Number(form.category_id))) {
      alert("Danh mục được chọn không tồn tại. Vui lòng chọn lại.");
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
          <Label>Danh mục</Label>
          {categories.length > 0 ? (
            <select
              className="w-full border rounded px-3 py-2"
              value={form.category_id || ""}
              onChange={(e) => updateField("category_id", Number(e.target.value))}
              required
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name} (ID: {c.category_id})
                </option>
              ))}
            </select>
          ) : (
            <Input
              type="number"
              value={form.category_id}
              onChange={(e) => updateField("category_id", Number(e.target.value))}
              placeholder="Nhap category_id ton tai"
              required
            />
          )}
          {loadingCategories && <p className="text-xs text-gray-500 mt-1">Dang tai danh muc...</p>}
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

function CustomerForm({
  customer,
  onCancel,
  onSaved,
  authToken,
}: {
  customer: any | null;
  onCancel: () => void;
  onSaved: (customer: any) => void;
  authToken?: string | null;
}) {
  const [form, setForm] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    password: "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";

      const body: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
      };

      // Chỉ gửi password nếu có nhập (khi tạo mới hoặc muốn đổi)
      if (form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Lưu thất bại");
      }

      const savedCustomer = await res.json();
      toast.success(customer ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng mới");
      onSaved(savedCustomer);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">
              {customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
            </h3>
            <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tên khách hàng *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label>Mật khẩu {!customer && "*"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required={!customer}
                placeholder={customer ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
              />
            </div>

            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="0901234567"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Đường ABC, Quận 1"
              />
            </div>

            <div>
              <Label>Thành phố</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="TP.HCM"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : customer ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
