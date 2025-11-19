import { Router } from "express";
import { previewCart } from "../services/cartService";

const router = Router();

router.post("/preview", async (req, res) => {
  try {
    const items = req.body?.items;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "items phải là một array [{ productId, quantity }]"
      });
    }

    const preview = await previewCart(items);
    return res.json(preview);

  } catch (err: any) {
    return res.status(400).json({
      error: err.message || "Có lỗi xảy ra khi preview cart"
    });
  }
});

export default router;

