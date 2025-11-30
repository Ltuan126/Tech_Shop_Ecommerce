import { useEffect, useState } from "react";
import { Star, ThumbsUp, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Review {
  review_id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_name: string;
}

interface ReviewListProps {
  productId: number;
  refreshTrigger?: number;
}

export default function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews
      let url = `http://localhost:3001/api/reviews?product_id=${productId}&status=APPROVED&limit=50`;
      if (filter) {
        url += `&rating=${filter}`;
      }

      const reviewsResponse = await fetch(url);
      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData.reviews || []);

      // Fetch summary (with error handling)
      try {
        const summaryResponse = await fetch(
          `http://localhost:3001/api/reviews/product/${productId}/summary`
        );
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        } else {
          setSummary(null);
        }
      } catch (summaryError) {
        console.error("Error fetching summary:", summaryError);
        setSummary(null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, filter, refreshTrigger]);

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn cần đăng nhập để đánh dấu hữu ích");
        return;
      }

      await fetch(`http://localhost:3001/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchReviews();
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBar = (starCount: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <button
        onClick={() => setFilter(filter === starCount ? null : starCount)}
        className={`flex items-center gap-2 w-full hover:bg-gray-50 p-2 rounded transition ${
          filter === starCount ? "bg-blue-50" : ""
        }`}
      >
        <span className="text-sm w-12">{starCount} sao</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {summary && summary.review_count > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center border-r">
              <div className="text-5xl font-bold text-gray-900">
                {Number(summary.avg_rating).toFixed(1)}
              </div>
              <div className="flex gap-1 my-2">
                {renderStars(Math.round(Number(summary.avg_rating)))}
              </div>
              <div className="text-gray-600">
                {summary.review_count} đánh giá
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-1">
              {renderRatingBar(5, Number(summary.five_star_count), Number(summary.review_count))}
              {renderRatingBar(4, Number(summary.four_star_count), Number(summary.review_count))}
              {renderRatingBar(3, Number(summary.three_star_count), Number(summary.review_count))}
              {renderRatingBar(2, Number(summary.two_star_count), Number(summary.review_count))}
              {renderRatingBar(1, Number(summary.one_star_count), Number(summary.review_count))}
            </div>
          </div>

          {filter && (
            <div className="mt-4">
              <button
                onClick={() => setFilter(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Xóa bộ lọc {filter} sao
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">
              {filter
                ? `Không có đánh giá ${filter} sao nào`
                : "Chưa có đánh giá nào cho sản phẩm này"}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.review_id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Đã mua hàng
                      </span>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <time className="text-sm text-gray-500">
                  {format(new Date(review.created_at), "dd/MM/yyyy", { locale: vi })}
                </time>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}

              {/* Comment */}
              {review.comment && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
              )}

              {/* Helpful Button */}
              <button
                onClick={() => handleMarkHelpful(review.review_id)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
              >
                <ThumbsUp className="w-4 h-4" />
                Hữu ích ({review.helpful_count})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
