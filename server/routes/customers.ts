import { Router } from "express";
import * as customerService from "../services/customerService";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

const router = Router();

function ensureAdmin(req: AuthenticatedRequest, res, next) {
  if (req.user?.role?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// GET /api/customers
router.get("/", async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword : "";
    const city = typeof req.query.city === "string" ? req.query.city : "";
    // Luôn kèm khách hàng DISABLED để admin có thể khôi phục
    const includeDisabled = true;

    const filter = {
      keyword,
      city,
      includeDisabled,
    };
    const data = await customerService.listCustomers(filter);
    res.json(data);
  } catch (error) {
    console.error("[GET /api/customers] failed:", error);
    res.status(500).json({ message: "KhA'ng th��� l���y danh sA�ch khA�ch hA�ng" });
  }
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID khA'ng h���p l���" });
    }

    const data = await customerService.getCustomerById(id);
    if (!data) {
      return res.status(404).json({ message: "KhA'ng tA�m th���y khA�ch hA�ng" });
    }

    res.json(data);
  } catch (error) {
    console.error("[GET /api/customers/:id] failed:", error);
    res.status(500).json({ message: "KhA'ng th��� l���y thA'ng tin khA�ch hA�ng" });
  }
});

// POST /api/customers (admin)
router.post("/", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, phone, address, city } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu tên / email / mật khẩu" });
    }
    const created = await customerService.createCustomer({ name, email, password, phone, address, city });
    res.status(201).json(created);
  } catch (error: any) {
    console.error("[POST /api/customers] failed:", error);
    res.status(400).json({ message: error?.message || "Không thể tạo khách hàng" });
  }
});

// PUT /api/customers/:id (admin)
router.put("/:id", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ" });
    const updated = await customerService.updateCustomer(id, {
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
      phone: req.body?.phone,
      address: req.body?.address,
      city: req.body?.city,
    });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json(updated);
  } catch (error: any) {
    console.error("[PUT /api/customers/:id] failed:", error);
    res.status(400).json({ message: error?.message || "Không thể cập nhật khách hàng" });
  }
});

// DELETE /api/customers/:id (admin)
router.delete("/:id", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ" });
    const result = await customerService.deleteCustomer(id);
    if (result.notFound) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }
    if (result.blockedByReference) {
      return res.status(409).json({
        message: "Khách hàng đã có đơn hàng/dữ liệu liên quan nên không thể xóa để đảm bảo toàn vẹn dữ liệu.",
      });
    }
    if (!result.deleted) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/customers/:id] failed:", error);
    res.status(400).json({ message: error?.message || "Không thể xóa khách hàng" });
  }
});

// PATCH /api/customers/:id/restore (admin)
router.patch("/:id/restore", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ" });
    const restored = await customerService.restoreCustomer(id);
    if (!restored) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json(restored);
  } catch (error: any) {
    console.error("[PATCH /api/customers/:id/restore] failed:", error);
    res.status(400).json({ message: error?.message || "Không thể khôi phục khách hàng" });
  }
});

export default router;
