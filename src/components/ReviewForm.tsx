import { useState, useEffect } from "react";
import { Star, ShieldCheck } from "lucide-react";

interface ReviewFormProps {
  productId: number;
  onSubmitSuccess?: () => void;
}

export default function ReviewForm({ productId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const checkReviewPermission = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Chưa đăng nhập - không gọi API, chỉ set state
          setCanReview(false);
          setError("Vui lòng đăng nhập để có thể đánh giá sản phẩm");
          setCheckingPermission(false);
          return;
        }

        // Đã đăng nhập - gọi API kiểm tra quyền
        const response = await fetch(`http://localhost:3001/api/reviews/can-review/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setCanReview(false);
          setError("Không thể kiểm tra quyền đánh giá");
          setCheckingPermission(false);
          return;
        }

        const data = await response.json();
        setCanReview(data.canReview);
        if (!data.canReview) {
          // Đã đăng nhập nhưng chưa mua hoặc đã review rồi
          setError(data.reason || "Bạn không thể đánh giá sản phẩm này");
        }
      } catch (err) {
        console.error("Error checking permission:", err);
        setCanReview(false);
        setError("Không thể kiểm tra quyền đánh giá");
      } finally {
        setCheckingPermission(false);
      }
    };

    checkReviewPermission();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn cần đăng nhập để đánh giá sản phẩm");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("http://localhost:3001/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          title,
          comment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể gửi đánh giá");
      }

      // Reset form
      setRating(5);
      setTitle("");
      setComment("");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (checkingPermission) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Cannot review
  if (canReview === false) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Viết đánh giá của bạn</h3>
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-900 mb-1">Không thể đánh giá</p>
            <p className="text-sm text-yellow-800">{error || "Bạn cần mua và nhận sản phẩm này để có thể đánh giá"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-visible">
      <h3 className="text-xl font-semibold mb-4">Viết đánh giá của bạn</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="overflow-visible">
        {/* Rating Stars */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá của bạn
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-gray-600">
              {rating} / 5 sao
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề (tùy chọn)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tóm tắt đánh giá của bạn"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'block',
            marginTop: '24px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
        >
          {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </form>
    </div>
  );
}
