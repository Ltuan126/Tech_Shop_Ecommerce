import { Router } from "express";
import { listDeals } from "../services/dealService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const deals = await listDeals(Number.isFinite(limit) ? limit : 8);
    res.json(deals);
  } catch (error) {
    console.error("[GET /api/deals] failed:", error);
    res.status(500).json({ message: "Không l?y du?c danh sách khuy?n mãi" });
  }
});

export default router;
