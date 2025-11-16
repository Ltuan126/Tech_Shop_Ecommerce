import { Router } from "express";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";

const router = Router();

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

router.get("/", async (req, res) => {
  try {
    const filters = {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      categoryId: toNumber(req.query.categoryId),
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      inStockOnly: req.query.inStock === "true" || req.query.inStock === "1",
      page: toNumber(req.query.page),
      pageSize: toNumber(req.query.pageSize),
    };

    const result = await listProducts(filters);
    res.json(result);
  } catch (error) {
    console.error("[GET /api/products] failed:", error);
    res.status(500).json({ message: "Không lấy được danh sách sản phẩm" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
  } catch (error) {
    console.error("[GET /api/products/:id] failed:", error);
    res.status(500).json({ message: "Không lấy được thông tin sản phẩm" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, price, categoryId, brandId } = req.body ?? {};
    if (!name || typeof price !== "number" || !categoryId || !brandId) {
      return res
        .status(400)
        .json({ message: "Tên, giá, danh mục và thương hiệu là bắt buộc" });
    }

    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("[POST /api/products] failed:", error);
    res.status(500).json({ message: "Không thể tạo sản phẩm" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const updated = await updateProduct(id, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(updated);
  } catch (error) {
    console.error("[PUT /api/products/:id] failed:", error);
    res.status(500).json({ message: "Không thể cập nhật sản phẩm" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const existing = await getProductById(id);
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    await deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    console.error("[DELETE /api/products/:id] failed:", error);
    res.status(500).json({ message: "Không thể xoá sản phẩm" });
  }
});

export default router;
