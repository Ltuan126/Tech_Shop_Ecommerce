import { Router } from "express";
import { listOrders, getOrderById, createOrder, listOrdersByUser, setOrderStatus } from "../services/orderService";
import { requireAuth } from "../middleware/requireAuth";
import type { AuthenticatedRequest } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const orders = await listOrders();
  res.json(orders);
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const orders = await listOrdersByUser(userId);
  res.json(orders);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  const order = await getOrderById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(order);
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { items, shippingAddress, paymentMethod = "COD", couponCode } = req.body ?? {};
    const order = await createOrder({
      userId,
      items,
      shippingAddress: shippingAddress ?? "",
      paymentMethod,
      couponCode,
    });
    res.status(201).json(order);
  } catch (error: any) {
    console.error("[POST /api/orders] failed:", error);
    res.status(400).json({ message: error?.message ?? "Không thể tạo đơn hàng" });
  }
});

router.patch("/:id/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.user?.role?.toUpperCase();
    if (role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const id = Number(req.params.id);
    const { status } = req.body ?? {};
    const allowed = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!status || !allowed.includes(String(status).toUpperCase())) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    await setOrderStatus(id, String(status).toLowerCase() as any, req.user?.id);
    const order = await getOrderById(id);
    res.json(order);
  } catch (err: any) {
    console.error("[PATCH /api/orders/:id/status] failed:", err);
    res.status(400).json({ message: err?.message ?? "Không thể cập nhật trạng thái" });
  }
});

export default router;
