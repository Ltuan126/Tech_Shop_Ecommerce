import { Router } from "express";
import { submitSupportRequest } from "../services/supportService";

const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, email, message, topic, orderId } = req.body ?? {};
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Vui lòng cung c?p h? tên, email và n?i dung" });
    }

    const result = await submitSupportRequest({ name, email, message, topic, orderId });
    res.status(201).json(result);
  } catch (error) {
    console.error("[POST /api/support/contact] failed:", error);
    res.status(500).json({ message: "Không g?i du?c yêu c?u h? tr?" });
  }
});

export default router;
