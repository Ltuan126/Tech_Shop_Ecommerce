import { Router } from "express";
import { listOrders, getOrderById } from "../services/orderService";

const router = Router();

router.get("/", async (_req, res) => {
  const orders = await listOrders();
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const order = await getOrderById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(order);
});

router.post("/", (_req, res) => {
  res.status(501).json({ message: "createOrder not implemented" });
});

router.patch("/:id/status", (_req, res) => {
  res.status(501).json({ message: "updateOrderStatus not implemented" });
});

export default router;
