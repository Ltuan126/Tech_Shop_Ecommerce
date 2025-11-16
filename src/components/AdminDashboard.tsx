import { useEffect, useState } from "react";
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
  TrendingUp,
  DollarSign,
  Eye,
  BarChart3,
} from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "./ProductCard";

interface AdminDashboardProps {
  onLogout: () => void;
  userEmail: string;
  products: Product[];
}

type AdminView = "overview" | "products" | "orders" | "customers" | "settings";

interface Order {
  id: number;
  customer: string;
  email: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered";
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

export function AdminDashboard({ onLogout, userEmail, products }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    // TODO: replace with actual MySQL fetch logic
    setOrders((prev) => prev);
    setCustomers((prev) => prev);
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status];
  };

  const getStatusText = (status: Order["status"]) => {
    const texts = {
      pending: "Ch? x? l?",
      processing: "?ang x? l?",
      shipped: "?ang giao",
      delivered: "?? giao",
    };
    return texts[status];
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  const menuItems = [
    { id: "overview" as AdminView, icon: LayoutDashboard, label: "T?ng quan" },
    { id: "products" as AdminView, icon: Package, label: "S?n ph?m" },
    { id: "orders" as AdminView, icon: ShoppingCart, label: "?on h?ng" },
    { id: "customers" as AdminView, icon: Users, label: "Kh?ch h?ng" },
    { id: "settings" as AdminView, icon: Settings, label: "C?i d?t" },
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
                    currentView === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
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
            <p className="text-sm text-gray-500">?ang nh?p v?i</p>
            <p className="text-sm truncate">{userEmail}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            ?ang xu?t
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Overview */}
        {currentView === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl mb-2">T?ng quan</h2>
              <p className="text-gray-600">Ch?o m?ng tr? l?i, Admin!</p>
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
                <p className="text-gray-600 text-sm mb-1">?on h?ng</p>
                <p className="text-2xl">{totalOrders}</p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Stable</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-1">S?n ph?m</p>
                <p className="text-2xl">{totalProducts}</p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">+15.3%</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-1">Kh?ch h?ng</p>
                <p className="text-2xl">{totalCustomers}</p>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <h3 className="text-xl mb-4">?on h?ng g?n d?y</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">M? don</th>
                      <th className="text-left py-3 px-4">Kh?ch h?ng</th>
                      <th className="text-left py-3 px-4">Ng?y</th>
                      <th className="text-left py-3 px-4">T?ng ti?n</th>
                      <th className="text-left py-3 px-4">Tr?ng th?i</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={5}>
                          Chua c? don h?ng n?o
                        </td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono">#{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("vi-VN")}</td>
                        <td className="py-3 px-4">{formatVND(order.total)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Products */}
        {currentView === "products" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl mb-2">Qu?n l? s?n ph?m</h2>
                <p className="text-gray-600">T?ng {products.length} s?n ph?m</p>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Th?m s?n ph?m m?i
              </Button>
            </div>

            <Card className="p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="T?m ki?m s?n ph?m..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-6">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                        <Badge className={product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {product.inStock ? "C?n h?ng" : "H?t h?ng"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Gi? b?n</p>
                          <p className="text-lg">{formatVND(product.price)}</p>
                        </div>
                        {product.originalPrice && (
                          <div>
                            <p className="text-sm text-gray-500">Gi? g?c</p>
                            <p className="text-lg line-through text-gray-400">{formatVND(product.originalPrice)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">??nh gi?</p>
                          <p className="text-lg">? {product.rating} ({product.reviews})</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          S?a
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Xem
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-2" />
                          X?a
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Orders */}
        {currentView === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Quan ly don hang</h2>
              <p className="text-gray-600">Tong {orders.length} don hang</p>
            </div>

            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Ma don</th>
                      <th className="text-left py-3 px-4">Khach hang</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Ngay</th>
                      <th className="text-left py-3 px-4">So luong</th>
                      <th className="text-left py-3 px-4">Tong tien</th>
                      <th className="text-left py-3 px-4">Trang thai</th>
                      <th className="text-left py-3 px-4">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={8}>
                          Chua co don hang nao
                        </td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono">#{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.email}</td>
                        <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("vi-VN")}</td>
                        <td className="py-3 px-4">{order.items} san pham</td>
                        <td className="py-3 px-4">{formatVND(order.total)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}        {/* Customers */}
        {currentView === "customers" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl mb-2">Quan ly khach hang</h2>
              <p className="text-gray-600">Tong {customers.length} khach hang</p>
            </div>

            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Ten khach hang</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">So don</th>
                      <th className="text-left py-3 px-4">Tong chi tieu</th>
                      <th className="text-left py-3 px-4">Ngay tham gia</th>
                      <th className="text-left py-3 px-4">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-gray-500" colSpan={7}>
                          Chua co khach hang nao
                        </td>
                      </tr>
                    ) : customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">#{customer.id}</td>
                        <td className="py-3 px-4">{customer.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                        <td className="py-3 px-4">{customer.orders} don</td>
                        <td className="py-3 px-4">{formatVND(customer.spent)}</td>
                        <td className="py-3 px-4">{new Date(customer.joined).toLocaleDateString("vi-VN")}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        {currentView === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl mb-2">C?i d?t</h2>
              <p className="text-gray-600">Qu?n l? c?u h?nh h? th?ng</p>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl mb-4">Th?ng tin c?a h?ng</h3>
                <div className="space-y-4">
                  <div>
                    <Label>T?n c?a h?ng</Label>
                    <Input defaultValue="TechStore" />
                  </div>
                  <div>
                    <Label>Email li?n h?</Label>
                    <Input defaultValue="support@techstore.vn" />
                  </div>
                  <div>
                    <Label>S? di?n tho?i</Label>
                    <Input defaultValue="1900 1234" />
                  </div>
                  <div>
                    <Label>??a ch?</Label>
                    <Input defaultValue="123 Nguy?n Hu?, Qu?n 1, TP.HCM" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl mb-4">C?i d?t v?n chuy?n</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Ph? v?n chuy?n m?c d?nh (?)</Label>
                    <Input type="number" defaultValue="50000" />
                  </div>
                  <div>
                    <Label>Mi?n ph? v?n chuy?n t? (?)</Label>
                    <Input type="number" defaultValue="1250000" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl mb-4">C?i d?t thanh to?n</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked />
                    <span>Thanh to?n khi nh?n h?ng (COD)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked />
                    <span>Chuy?n kho?n ng?n h?ng</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" />
                    <span>Thanh to?n th? t?n d?ng</span>
                  </label>
                </div>
              </Card>

              <Button className="w-full" size="lg">
                Luu thay d?i
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}





