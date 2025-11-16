import { Router } from "express";
import { listCategories } from "../services/categoryService";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const categories = await listCategories();
    res.json(categories);
  } catch (error) {
    console.error("[GET /api/categories] failed:", error);
    res.status(500).json({ message: "Không l?y du?c danh m?c" });
  }
});

export default router;
