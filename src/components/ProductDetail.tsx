import { useEffect, useState } from "react";
import { X, ShoppingCart, Star, Package, Shield, Truck } from "lucide-react";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

interface ProductDetailProps {
  productId: number;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export default function ProductDetail({ productId, onClose, onAddToCart }: ProductDetailProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [reviewRefresh, setReviewRefresh] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleReviewSubmitSuccess = () => {
    setReviewRefresh((prev) => prev + 1);
    setActiveTab("reviews");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const inStock = product.status !== "OUT_OF_STOCK" && product.stock > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Product Info */}
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Image */}
            <div className="relative">
              <img
                src={product.image || "/placeholder.png"}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  {renderStars(product.avg_rating || 0)}
                  <span className="text-sm text-gray-600">
                    ({product.review_count || 0} đánh giá)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-b py-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-blue-600">
                    {product.price.toLocaleString("vi-VN")}đ
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xl text-gray-400 line-through">
                      {product.original_price.toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Tình trạng: {inStock ? "Còn hàng" : "Hết hàng"}</span>
                </div>
                {product.warranty_month && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>Bảo hành: {product.warranty_month} tháng</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-700">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Miễn phí vận chuyển toàn quốc</span>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={() => {
                  onAddToCart({
                    id: product.product_id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  });
                }}
                disabled={!inStock}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === "details"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mô tả sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === "reviews"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Đánh giá ({product.review_count || 0})
              </button>
            </div>

            <div className="p-6">
              {activeTab === "details" ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <ReviewForm
                    productId={product.product_id}
                    onSubmitSuccess={handleReviewSubmitSuccess}
                  />
                  <ReviewList productId={product.product_id} refreshTrigger={reviewRefresh} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
