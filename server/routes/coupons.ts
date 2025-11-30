import { Router } from "express";
import { query } from "../../src/lib/db";
import type { RowDataPacket } from "mysql2";

const router = Router();

// POST /api/coupons/validate - Validate coupon code
router.post("/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Mã khuyến mãi không được để trống" });
    }

    // Get coupon from database
    const coupons = await query<RowDataPacket[]>(
      `SELECT * FROM coupon WHERE code = ? AND status = 'ACTIVE'`,
      [code.toUpperCase()]
    );

    if (!Array.isArray(coupons) || coupons.length === 0) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại hoặc đã hết hạn" });
    }

    const coupon = coupons[0];

    // Check expiry dates
    const now = new Date();
    const startAt = new Date(coupon.start_at);
    const endAt = new Date(coupon.end_at);

    if (now < startAt) {
      return res.status(400).json({ message: "Mã khuyến mãi chưa có hiệu lực" });
    }

    if (now > endAt) {
      return res.status(400).json({ message: "Mã khuyến mãi đã hết hạn" });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
    }

    // Check minimum order value
    if (orderTotal < coupon.min_order) {
      return res.status(400).json({
        message: `Đơn hàng tối thiểu ${coupon.min_order.toLocaleString("vi-VN")}đ để sử dụng mã này`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENT") {
      discountAmount = (orderTotal * coupon.value) / 100;
      // Apply max discount if set
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.type === "FIXED") {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    res.json({
      valid: true,
      coupon: {
        coupon_id: coupon.coupon_id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        max_discount: coupon.max_discount,
        min_order: coupon.min_order,
      },
      discountAmount: Math.round(discountAmount),
      finalTotal: Math.round(orderTotal - discountAmount),
    });
  } catch (error: any) {
    console.error("[POST /api/coupons/validate] failed:", error);
    res.status(500).json({ message: "Không thể xác thực mã khuyến mãi" });
  }
});

// POST /api/coupons/apply - Apply coupon (increment usage)
router.post("/apply", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Mã khuyến mãi không được để trống" });
    }

    // Increment used_count
    await query(
      `UPDATE coupon SET used_count = used_count + 1 WHERE code = ? AND status = 'ACTIVE'`,
      [code.toUpperCase()]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/coupons/apply] failed:", error);
    res.status(500).json({ message: "Không thể áp dụng mã khuyến mãi" });
  }
});

export default router;
