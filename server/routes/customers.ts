import { Router } from "express";
import * as customerService from "../services/customerService";

const router = Router();

// GET /api/customers
router.get("/", async (req, res) => {
  try {
    const filter = {
      keyword: req.query.keyword || "",
      city: req.query.city || "",
    };
    const data = await customerService.listCustomers(filter);
    res.json(data);
  } catch (error) {
    console.error("[GET /api/customers] failed:", error);
    res.status(500).json({ message: "Không thể lấy danh sách khách hàng" });
  }
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const data = await customerService.getCustomerById(id);
    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    res.json(data);
  } catch (error) {
    console.error("[GET /api/customers/:id] failed:", error);
    res.status(500).json({ message: "Không thể lấy thông tin khách hàng" });
  }
});

export default router;
