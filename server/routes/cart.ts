import { Router } from "express";
import { previewCart } from "../services/cartService";

const router = Router();

router.post("/preview", async (req, res) => {
  const items = req.body?.items ?? [];
  const preview = await previewCart(items);
  res.json(preview);
});

export default router;
