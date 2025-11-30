import { query } from "../../src/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface ProductReview {
  review_id: number;
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: Date;
  updated_at: Date;
  // Joined fields
  user_name?: string;
  user_email?: string;
  product_name?: string;
}

export interface CreateReviewInput {
  product_id: number;
  user_id: number;
  order_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewFilters {
  product_id?: number;
  user_id?: number;
  rating?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  is_verified_purchase?: boolean;
}

export interface ProductRatingSummary {
  product_id: number;
  review_count: number;
  avg_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

// =====================================================
// REVIEW SERVICE
// =====================================================

class ReviewService {
  /**
   * Tạo review mới
   */
  async createReview(input: CreateReviewInput): Promise<ProductReview> {
    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error("Rating phải từ 1 đến 5");
    }

    // Kiểm tra quyền đánh giá
    const permission = await this.canUserReview(input.user_id, input.product_id);
    if (!permission.canReview) {
      throw new Error(permission.reason || "Bạn không có quyền đánh giá sản phẩm này");
    }

    // Sử dụng order_id từ permission nếu không được cung cấp
    const orderId = input.order_id || permission.orderId;

    // Insert review (is_verified_purchase = true vì đã kiểm tra ở trên)
    const result = await query<ResultSetHeader>(
      `INSERT INTO product_reviews
       (product_id, user_id, order_id, rating, title, comment, images, is_verified_purchase, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.product_id,
        input.user_id,
        orderId,
        input.rating,
        input.title || null,
        input.comment || null,
        input.images ? JSON.stringify(input.images) : null,
        true, // Luôn là verified purchase vì đã kiểm tra ở canUserReview
        "APPROVED", // Auto approve
      ]
    );

    return this.getReviewById(result.insertId);
  }

  /**
   * Lấy review theo ID
   */
  async getReviewById(reviewId: number): Promise<ProductReview> {
    const [review] = await query<RowDataPacket[]>(
      `SELECT pr.*, u.name AS user_name, u.email AS user_email
       FROM product_reviews pr
       JOIN user u ON pr.user_id = u.user_id
       WHERE pr.review_id = ?`,
      [reviewId]
    );

    if (!review) {
      throw new Error("Không tìm thấy review");
    }

    return this.mapReview(review);
  }

  /**
   * Lấy danh sách reviews theo filters
   */
  async listReviews(
    filters: ReviewFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<{ reviews: ProductReview[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.product_id) {
      conditions.push("pr.product_id = ?");
      params.push(filters.product_id);
    }

    if (filters.user_id) {
      conditions.push("pr.user_id = ?");
      params.push(filters.user_id);
    }

    if (filters.rating) {
      conditions.push("pr.rating = ?");
      params.push(filters.rating);
    }

    if (filters.status) {
      conditions.push("pr.status = ?");
      params.push(filters.status);
    }

    if (filters.is_verified_purchase !== undefined) {
      conditions.push("pr.is_verified_purchase = ?");
      params.push(filters.is_verified_purchase);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const [countResult] = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM product_reviews pr ${whereClause}`,
      params
    );
    const total = countResult.total;

    // Get reviews
    const reviews = await query<RowDataPacket[]>(
      `SELECT pr.*, u.name AS user_name, u.email AS user_email, p.name AS product_name
       FROM product_reviews pr
       JOIN user u ON pr.user_id = u.user_id
       LEFT JOIN product p ON pr.product_id = p.product_id
       ${whereClause}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      reviews: reviews.map((r) => this.mapReview(r)),
      total,
    };
  }

  /**
   * Cập nhật review (chỉ owner mới được sửa)
   */
  async updateReview(
    reviewId: number,
    userId: number,
    input: UpdateReviewInput
  ): Promise<ProductReview> {
    // Kiểm tra ownership
    const [review] = await query<RowDataPacket[]>(
      "SELECT user_id FROM product_reviews WHERE review_id = ?",
      [reviewId]
    );

    if (!review) {
      throw new Error("Không tìm thấy review");
    }

    if (review.user_id !== userId) {
      throw new Error("Bạn không có quyền sửa review này");
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error("Rating phải từ 1 đến 5");
      }
      updates.push("rating = ?");
      params.push(input.rating);
    }

    if (input.title !== undefined) {
      updates.push("title = ?");
      params.push(input.title);
    }

    if (input.comment !== undefined) {
      updates.push("comment = ?");
      params.push(input.comment);
    }

    if (input.images !== undefined) {
      updates.push("images = ?");
      params.push(input.images ? JSON.stringify(input.images) : null);
    }

    if (updates.length === 0) {
      return this.getReviewById(reviewId);
    }

    params.push(reviewId);

    await query(
      `UPDATE product_reviews SET ${updates.join(", ")} WHERE review_id = ?`,
      params
    );

    return this.getReviewById(reviewId);
  }

  /**
   * Xóa review (chỉ owner hoặc admin)
   */
  async deleteReview(reviewId: number, userId: number, isAdmin: boolean = false): Promise<void> {
    const [review] = await query<RowDataPacket[]>(
      "SELECT user_id FROM product_reviews WHERE review_id = ?",
      [reviewId]
    );

    if (!review) {
      throw new Error("Không tìm thấy review");
    }

    if (!isAdmin && review.user_id !== userId) {
      throw new Error("Bạn không có quyền xóa review này");
    }

    await query("DELETE FROM product_reviews WHERE review_id = ?", [reviewId]);
  }

  /**
   * Admin duyệt/từ chối review
   */
  async moderateReview(
    reviewId: number,
    status: "APPROVED" | "REJECTED"
  ): Promise<ProductReview> {
    await query("UPDATE product_reviews SET status = ? WHERE review_id = ?", [
      status,
      reviewId,
    ]);

    return this.getReviewById(reviewId);
  }

  /**
   * Đánh dấu review hữu ích
   */
  async markHelpful(reviewId: number, userId: number): Promise<void> {
    // Kiểm tra đã đánh dấu chưa
    const [existing] = await query<RowDataPacket[]>(
      "SELECT * FROM review_helpfulness WHERE review_id = ? AND user_id = ?",
      [reviewId, userId]
    );

    if (existing) {
      // Đã đánh dấu rồi thì bỏ đánh dấu
      await query("DELETE FROM review_helpfulness WHERE review_id = ? AND user_id = ?", [
        reviewId,
        userId,
      ]);
      await query(
        "UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE review_id = ?",
        [reviewId]
      );
    } else {
      // Chưa đánh dấu thì thêm
      await query("INSERT INTO review_helpfulness (review_id, user_id) VALUES (?, ?)", [
        reviewId,
        userId,
      ]);
      await query(
        "UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE review_id = ?",
        [reviewId]
      );
    }
  }

  /**
   * Lấy rating summary của sản phẩm
   */
  async getProductRatingSummary(productId: number): Promise<ProductRatingSummary> {
    const [summary] = await query<RowDataPacket[]>(
      "SELECT * FROM product_rating_summary WHERE product_id = ?",
      [productId]
    );

    if (!summary) {
      return {
        product_id: productId,
        review_count: 0,
        avg_rating: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0,
      };
    }

    return summary as ProductRatingSummary;
  }

  /**
   * Kiểm tra user có quyền đánh giá sản phẩm không
   */
  async canUserReview(userId: number, productId: number): Promise<{
    canReview: boolean;
    reason?: string;
    orderId?: number;
  }> {
    // Kiểm tra đã review chưa
    const [existingReview] = await query<RowDataPacket[]>(
      "SELECT review_id FROM product_reviews WHERE product_id = ? AND user_id = ?",
      [productId, userId]
    );

    if (existingReview) {
      return {
        canReview: false,
        reason: "Bạn đã đánh giá sản phẩm này rồi",
      };
    }

    // Kiểm tra đã mua hàng chưa (cho phép review khi đơn hàng đã PROCESSING trở lên)
    const deliveredOrders = await query<RowDataPacket[]>(
      `SELECT o.order_id
       FROM \`order\` o
       JOIN customer c ON o.customer_id = c.customer_id
       JOIN order_detail od ON o.order_id = od.order_id
       WHERE c.user_id = ? AND od.product_id = ?
         AND o.status IN ('PROCESSING', 'SHIPPED', 'COMPLETED')
       LIMIT 1`,
      [userId, productId]
    );

    if (deliveredOrders.length === 0) {
      return {
        canReview: false,
        reason: "Bạn cần mua và nhận sản phẩm này để có thể đánh giá",
      };
    }

    return {
      canReview: true,
      orderId: deliveredOrders[0].order_id,
    };
  }

  /**
   * Map database row to ProductReview
   */
  private mapReview(row: RowDataPacket): ProductReview {
    return {
      review_id: row.review_id,
      product_id: row.product_id,
      user_id: row.user_id,
      order_id: row.order_id,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      images: row.images ? JSON.parse(row.images) : null,
      is_verified_purchase: Boolean(row.is_verified_purchase),
      helpful_count: row.helpful_count,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.user_name,
      user_email: row.user_email,
      product_name: row.product_name,
    };
  }
}

export default new ReviewService();
