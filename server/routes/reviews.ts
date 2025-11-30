import { Router, Request, Response } from "express";
import reviewService from "../services/reviewService";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

const router = Router();

// =====================================================
// PUBLIC ROUTES - Xem reviews
// =====================================================

/**
 * GET /api/reviews?product_id=1&rating=5&limit=10&offset=0
 * Lấy danh sách reviews với filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      product_id,
      user_id,
      rating,
      status,
      is_verified_purchase,
      limit = "20",
      offset = "0",
    } = req.query;

    const filters: any = {};
    if (product_id) filters.product_id = Number(product_id);
    if (user_id) filters.user_id = Number(user_id);
    if (rating) filters.rating = Number(rating);
    if (status) filters.status = status as "PENDING" | "APPROVED" | "REJECTED";
    if (is_verified_purchase) filters.is_verified_purchase = is_verified_purchase === "true";

    const result = await reviewService.listReviews(
      filters,
      Number(limit),
      Number(offset)
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reviews/product/:productId/summary
 * Lấy rating summary của sản phẩm
 */
router.get("/product/:productId/summary", async (req: Request, res: Response) => {
  try {
    const summary = await reviewService.getProductRatingSummary(Number(req.params.productId));
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PROTECTED ROUTES - Cần đăng nhập
// =====================================================

/**
 * GET /api/reviews/can-review/:productId
 * Kiểm tra user có quyền đánh giá sản phẩm không
 */
router.get("/can-review/:productId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);

    const result = await reviewService.canUserReview(userId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reviews/:id
 * Lấy chi tiết 1 review
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const review = await reviewService.getReviewById(Number(req.params.id));
    res.json(review);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/reviews
 * Tạo review mới (user phải đăng nhập)
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { product_id, order_id, rating, title, comment, images } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: "Thiếu product_id hoặc rating" });
    }

    const review = await reviewService.createReview({
      product_id: Number(product_id),
      user_id: userId,
      order_id: order_id ? Number(order_id) : undefined,
      rating: Number(rating),
      title,
      comment,
      images,
    });

    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/reviews/:id
 * Cập nhật review (chỉ owner mới được sửa)
 */
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rating, title, comment, images } = req.body;

    const review = await reviewService.updateReview(Number(req.params.id), userId, {
      rating: rating ? Number(rating) : undefined,
      title,
      comment,
      images,
    });

    res.json(review);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

/**
 * DELETE /api/reviews/:id
 * Xóa review (owner hoặc admin)
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    await reviewService.deleteReview(Number(req.params.id), userId, isAdmin);
    res.json({ message: "Đã xóa review" });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

/**
 * POST /api/reviews/:id/helpful
 * Đánh dấu review hữu ích/bỏ đánh dấu
 */
router.post("/:id/helpful", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await reviewService.markHelpful(Number(req.params.id), userId);
    res.json({ message: "Đã cập nhật" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// =====================================================
// ADMIN ROUTES - Chỉ admin
// =====================================================

/**
 * PATCH /api/reviews/:id/moderate
 * Admin duyệt/từ chối review
 */
router.patch("/:id/moderate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Chỉ admin mới được duyệt review" });
    }

    const { status } = req.body;
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status phải là APPROVED hoặc REJECTED" });
    }

    const review = await reviewService.moderateReview(Number(req.params.id), status);
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
