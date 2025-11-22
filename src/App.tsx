import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ProductCard } from "./components/ProductCard";
import type { Product } from "./components/ProductCard";
import { ShoppingCart } from "./components/ShoppingCart";
import type { CartItem } from "./components/ShoppingCart";
import { FilterBar } from "./components/FilterBar";
import { Checkout } from "./components/Checkout";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import ProductDetail from "./components/ProductDetail";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { Card } from "./components/ui/card";
import { Mail, Phone, MapPin, Star, Tag, Headphones, CheckCircle } from "lucide-react";
import { Button } from "./components/ui/button.jsx";

// Prefer .env override, otherwise default to local backend
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001";

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  
  // Auth states
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [shouldOpenCheckoutAfterLogin, setShouldOpenCheckoutAfterLogin] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Refs for sections
  const homeRef = useRef(null);
  const productsRef = useRef(null);
  const dealsRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...uniqueCategories];
  }, [products]);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setProductError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message ?? "Khong the tai danh sach san pham");
        }

        const normalized: Product[] = (() => {
          const rawList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : [];

          return rawList.map((item: any) => {
            // Map API shape (product_id, original_price, category_name, stock/status) to UI shape
            const stock = typeof item?.stock === "number" ? item.stock : null;
            const status = typeof item?.status === "string" ? item.status : null;
            const inStock =
              status === "OUT_OF_STOCK"
                ? false
                : stock !== null
                ? stock > 0
                : true;

            return {
              id: item?.id ?? item?.product_id ?? 0,
              name: item?.name ?? "Unnamed product",
              price: Number(item?.price ?? 0),
              originalPrice: item?.originalPrice ?? item?.original_price ?? undefined,
              image: item?.image ?? "",
              category: item?.category ?? item?.category_name ?? "Uncategorized",
              inStock,
              rating: typeof item?.avg_rating === "number" ? item.avg_rating : (typeof item?.rating === "number" ? item.rating : 5),
              reviews: typeof item?.review_count === "number" ? item.review_count : (typeof item?.reviews === "number" ? item.reviews : 0),
            };
          });
        })();

        if (!ignore) {
          setProducts(normalized);
        }
      } catch (error) {
        if (!ignore) {
          setProductError(error instanceof Error ? error.message : "Khong the tai san pham");
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Get deals products (products with originalPrice)
  const dealsProducts = useMemo(() => {
    return products
      .filter((product) => product.inStock && product.originalPrice && product.originalPrice > product.price)
      .map((product) => {
        const discountPercent = Math.round(
          ((product.originalPrice! - product.price) / product.originalPrice!) * 100
        );
        return { product, discountPercent };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8)
      .map((entry) => entry.product);
  }, [products]);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      if (!isLoggedIn || !authToken) {
        setOrderHistory([]);
        return;
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/api/orders/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await resp.json().catch(() => []);
        if (!resp.ok) throw new Error(data?.message || "Khong the tai don hang");
        if (!cancelled) setOrderHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          console.warn("Load order history failed", err);
          setOrderHistory([]);
        }
      }
    }
    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, authToken]);

  // Scroll to section
  const handleNavigate = (section) => {
    const refs = {
      home: homeRef,
      products: productsRef,
      deals: dealsRef,
      about: aboutRef,
      contact: contactRef,
    };

    const targetRef = refs[section];
    if (targetRef?.current) {
      const yOffset = -80; // Account for fixed header
      const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        toast.success("Đã cập nhật số lượng!");
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast.success("Đã thêm vào giỏ hàng!");
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Đã xóa khỏi giỏ hàng");
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setShouldOpenCheckoutAfterLogin(true);
      setShowAuth(true);
      toast.error("Vui lòng đăng nhập để tiếp tục thanh toán");
      return;
    }
    setIsCartOpen(false);
    setIsCheckout(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckoutComplete = (orderData?: any) => {
    setIsCheckout(false);
    setOrderComplete(true);
    if (orderData) setLastOrder(orderData);
    setCartItems([]);
    toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua hàng.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Auto hide success message after 5 seconds
    setTimeout(() => {
      setOrderComplete(false);
    }, 5000);
  };

  const handleViewInvoice = async (orderId: number) => {
    if (!authToken) {
      toast.error("Vui long dang nhap de xem hoa don");
      return;
    }
    setSelectedOrderLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.message || "Khong the tai hoa don");
      }
      setSelectedOrder(data || null);
    } catch (err: any) {
      toast.error(err?.message || "Khong the tai hoa don");
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleBackToHome = () => {
    setIsCheckout(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = ({ email, role, token }) => {
    const adminStatus = typeof role === "string" && role.toUpperCase() === "ADMIN";
    setUserEmail(email);
    setUserRole(role);
    setAuthToken(token);
    setIsAdmin(adminStatus);
    setIsLoggedIn(true);
    setShowAuth(false);

    if (adminStatus) {
      toast.success("Dang nhap thanh cong! Chao mung Admin.");
    } else {
      toast.success(`Chao mung ${email}!`);
    }

    if (shouldOpenCheckoutAfterLogin) {
      setShouldOpenCheckoutAfterLogin(false);
      setIsCartOpen(false);
      setIsCheckout(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail("");
    setUserRole("");
    setAuthToken(null);
    setOrderHistory([]);
    toast.success("Da dang xuat thanh cong");
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Show Auth Page
  if (showAuth) {
    return (
      <>
        <AuthPage 
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
        <Toaster position="bottom-right" />
      </>
    );
  }

  // Show Admin Dashboard
  if (isLoggedIn && isAdmin) {
    return (
      <>
        <AdminDashboard
          onLogout={handleLogout}
          userEmail={userEmail}
          products={products}
          authToken={authToken}
        />
        <Toaster position="bottom-right" />
      </>
    );
  }

  // If in checkout, show checkout page
  if (isCheckout) {
    return (
      <>
        <Checkout
          items={cartItems}
          onBack={handleBackToHome}
          onComplete={handleCheckoutComplete}
          authToken={authToken}
        />
        <Toaster position="bottom-right" />
      </>
    );
  }

  // If order complete, show success page
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          cartItemCount={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
          onNavigate={handleNavigate}
          isLoggedIn={isLoggedIn}
          userEmail={userEmail}
          isAdmin={isAdmin}
          onLoginClick={() => setShowAuth(true)}
          onLogoutClick={handleLogout}
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg p-12 shadow-lg">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl mb-4">Đặt hàng thành công!</h1>
              <p className="text-gray-600 text-lg mb-8">
                Cảm ơn bạn đã mua hàng tại TechStore. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.
              </p>
              {lastOrder && (
                <div className="mb-6 text-left bg-gray-50 border rounded-lg p-6">
                  <p className="text-lg font-semibold">Thông tin đơn hàng</p>
                  <div className="mt-2 space-y-1 text-gray-700">
                    <p>Mã đơn: <span className="font-medium">#{lastOrder.id}</span></p>
                    <p>Tổng tiền: <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        lastOrder.total_amount || lastOrder.total || 0
                      )}
                    </span></p>
                    {lastOrder.payment_method && (
                      <p>Thanh toán: <span className="font-medium">{lastOrder.payment_method}</span></p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setOrderComplete(false);
                    handleNavigate("products");
                  }}
                >
                  Tiếp tục mua sắm
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full"
                  onClick={() => setOrderComplete(false)}
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartItemCount={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLoginClick={() => setShowAuth(true)}
        onLogoutClick={handleLogout}
      />
      
      {/* Home Section */}
      <div ref={homeRef}>
        <Hero onNavigate={handleNavigate} />
      </div>
      
      {/* Products Section */}
      <div ref={productsRef}>
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-3xl mb-2">
              {selectedCategory === "All" ? "Tất cả sản phẩm" : selectedCategory}
            </h2>
            <p className="text-gray-600">
              {isLoadingProducts ? "Đang tải dữ liệu..." : "Tìm thấy " + filteredProducts.length + " sản phẩm"}
            </p>
          </div>

          {isLoadingProducts ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách sản phẩm...</div>
          ) : productError ? (
            <div className="py-12 text-center text-red-500">
              <p className="text-xl">{productError}</p>
              <p className="text-gray-400 mt-2">Vui lòng thử lại sau.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-xl">Không tìm thấy sản phẩm</p>
              <p className="text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetail={setSelectedProductId}
                  index={index}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {isLoggedIn && !isAdmin && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl">Don hang cua ban</h2>
            <span className="text-gray-500 text-sm">{orderHistory.length} don</span>
          </div>
          {orderHistory.length === 0 ? (
            <div className="text-gray-500">Chua co don hang nao</div>
          ) : (
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <div key={order.id} className="bg-white border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Ma don #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(
                        order.createdAt ||
                        order.order_date ||
                        order.created_at ||
                        order.orderDate ||
                        Date.now()
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm uppercase text-blue-600">{(order.status || "").toString()}</p>
                      <p className="font-semibold">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                          order.total || order.total_amount || 0
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewInvoice(order.id)}
                      disabled={selectedOrderLoading}
                    >
                      Xem hoa don
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedOrder && (
            <div className="mt-6 bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Hoa don #{selectedOrder.id}</p>
                  <p className="text-sm text-gray-500">
                    Trang thai: {(selectedOrder.status || "N/A").toString()}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                  Dong
                </Button>
              </div>
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <p>
                  Tong tien:{" "}
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                      selectedOrder.total || selectedOrder.total_amount || 0
                    )}
                  </span>
                </p>
                {selectedOrder.payment_method && (
                  <p>Thanh toan: {selectedOrder.payment_method}</p>
                )}
                {selectedOrder.shipping_address && <p>Dia chi: {selectedOrder.shipping_address}</p>}
              </div>
              {(() => {
                const items =
                  selectedOrder.items ||
                  selectedOrder.order_items ||
                  selectedOrder.orderDetails ||
                  selectedOrder.details ||
                  [];
                if (!Array.isArray(items) || items.length === 0) return null;
                return (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Sản phẩm</p>
                    <div className="space-y-2">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.name || item.product_name || `SP #${item.product_id || item.productId || idx + 1}`}
                            {" x "}
                            {item.quantity || 1}
                          </span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                              (item.unitPrice || item.unit_price || item.price || 0) * (item.quantity || 1)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Deals Section */}
      <div ref={dealsRef} className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full mb-4">
              <Tag className="w-5 h-5" />
              <span>Giảm giá đặc biệt</span>
            </div>
            <h2 className="text-4xl mb-4">Khuyến mãi hot nhất</h2>
            <p className="text-gray-600 text-lg">Những sản phẩm đang có mức giá ưu đãi hấp dẫn</p>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-12 text-gray-500">Đang tải khuyến mãi...</div>
          ) : dealsProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dealsProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Hiện chưa có sản phẩm khuyến mãi</p>
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div ref={aboutRef} className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl mb-4">Về TechStore</h2>
              <p className="text-gray-600 text-lg">
                Điểm đến tin cậy cho mọi nhu cầu công nghệ của bạn
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl mb-2">Chất lượng cao</h3>
                <p className="text-gray-600">
                  Chỉ cung cấp sản phẩm chính hãng từ các thương hiệu uy tín hàng đầu
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl mb-2">Giá tốt nhất</h3>
                <p className="text-gray-600">
                  Cam kết mức giá cạnh tranh nhất thị trường với nhiều ưu đãi hấp dẫn
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl mb-2">Hỗ trợ 24/7</h3>
                <p className="text-gray-600">
                  Đội ngũ chăm sóc khách hàng chuyên nghiệp, sẵn sàng hỗ trợ mọi lúc
                </p>
              </Card>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl mb-4">Câu chuyện của chúng tôi</h3>
              <p className="text-gray-700 mb-4">
                TechStore được thành lập với sứ mệnh mang đến những sản phẩm công nghệ
                chất lượng cao với giá cả phải chăng cho mọi người. Chúng tôi tin rằng
                công nghệ không chỉ là công cụ, mà còn là cầu nối giúp cuộc sống trở nên
                tốt đẹp hơn.
              </p>
              <p className="text-gray-700">
                Với đội ngũ nhân viên nhiệt huyết và am hiểu sâu sắc về công nghệ, chúng tôi
                cam kết mang đến trải nghiệm mua sắm tốt nhất. Từ tư vấn sản phẩm đến dịch vụ
                hậu mãi, TechStore luôn đồng hành cùng bạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div ref={contactRef} className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl mb-4">Liên hệ với chúng tôi</h2>
              <p className="text-gray-600 text-lg">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="mb-2">Điện thoại</h4>
                <p className="text-gray-600">1900 1234</p>
                <p className="text-gray-600">024 3456 7890</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="mb-2">Email</h4>
                <p className="text-gray-600">support@techstore.vn</p>
                <p className="text-gray-600">sales@techstore.vn</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="mb-2">Địa chỉ</h4>
                <p className="text-gray-600">123 Nguyễn Huệ</p>
                <p className="text-gray-600">Quận 1, TP.HCM</p>
              </Card>
            </div>

            <Card className="p-8">
              <h3 className="text-2xl mb-6">Gửi tin nhắn cho chúng tôi</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Họ và tên</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Chủ đề</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tiêu đề tin nhắn"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Nội dung</label>
                  <textarea 
                    rows={5}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Viết tin nhắn của bạn..."
                  />
                </div>
                <Button className="w-full" size="lg">
                  Gửi tin nhắn
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl mb-4">TechStore</h3>
              <p className="text-gray-400">
                Điểm đến hàng đầu cho công nghệ và phụ kiện mới nhất.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Mua sắm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Tất cả sản phẩm</a></li>
                <li><a href="#" className="hover:text-white">Bán chạy nhất</a></li>
                <li><a href="#" className="hover:text-white">Hàng mới về</a></li>
                <li><a href="#" className="hover:text-white">Khuyến mãi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white">Vận chuyển</a></li>
                <li><a href="#" className="hover:text-white">Đổi trả</a></li>
                <li><a href="#" className="hover:text-white">Câu hỏi thường gặp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Công ty</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white">Điều khoản dịch vụ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TechStore. Bảo lưu mọi quyền.</p>
            <button 
              onClick={() => setShowAuth(true)}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              Đăng nhập Admin
            </button>
          </div>
        </div>
      </footer>

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}





















