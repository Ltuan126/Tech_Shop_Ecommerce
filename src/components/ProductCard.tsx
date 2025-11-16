import { ShoppingCart, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "framer-motion";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  index?: number;
}

// Format number to VND currency
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function ProductCard({ product, onAddToCart, index = 0 }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.5, 
        delay: (index % 4) * 0.1,
        ease: "easeOut" 
      }}
      whileHover={{ y: -8 }}
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-2 hover:border-blue-200 relative">
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          }}
        />
        
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            initial={false}
            whileHover={{
              background: [
                "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)",
              ],
              backgroundPosition: ["-200% 0", "200% 0"],
            }}
            transition={{ duration: 1.5 }}
            style={{ backgroundSize: "200% 100%" }}
          />
          
          {discount > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: (index % 4) * 0.1 + 0.3 
              }}
            >
              <Badge className="absolute top-2 right-2 bg-red-500 shadow-lg">
                {discount}% OFF
              </Badge>
            </motion.div>
          )}
          {!product.inStock && (
            <Badge className="absolute top-2 left-2 bg-gray-500">
              Out of Stock
            </Badge>
          )}
          
          {/* Quick add to cart overlay */}
          <motion.div
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                size="lg"
                className="shadow-2xl"
                onClick={() => onAddToCart(product)}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm vào giỏ
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="p-4 relative z-10">
          <p className="text-sm text-gray-500 mb-1">{product.category}</p>
          <h3 className="mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
          
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: (index % 4) * 0.1 + 0.4 + (i * 0.05),
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviews})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                >
                  {formatVND(product.price)}
                </motion.span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                onClick={() => onAddToCart(product)}
                disabled={!product.inStock}
                className="shadow-md hover:shadow-xl transition-shadow"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}