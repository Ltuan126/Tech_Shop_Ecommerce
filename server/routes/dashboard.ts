import { Router } from "express";
import { getDashboardSummary, getRecentOrders, getRecentCustomers } from "../services/dashboardService";

const router = Router();

router.get("/summary", async (_req, res) => {
  const summary = await getDashboardSummary();
  res.json(summary);
});

router.get("/orders/recent", async (_req, res) => {
  const data = await getRecentOrders();
  res.json(data);
});

router.get("/customers/recent", async (_req, res) => {
  const data = await getRecentCustomers();
  res.json(data);
});

export default router;
