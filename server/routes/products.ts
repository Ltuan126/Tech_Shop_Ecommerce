import { Router, Request, Response, NextFunction } from "express";
import * as productService from "../services/productService";
import * as categoryService from "../services/categoryService";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

const router = Router();

function ensureAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId, priceMin, priceMax, includeInactive, status } = req.query;

      const filter: productService.ProductFilter = {};

      if (typeof categoryId === "string" && categoryId.trim() !== "") {
        const cid = Number(categoryId);
        if (!Number.isNaN(cid)) {
          filter.categoryId = cid;
        }
      }

      if (typeof priceMin === "string" && priceMin.trim() !== "") {
        const pMin = Number(priceMin);
        if (!Number.isNaN(pMin)) {
          filter.priceMin = pMin;
        }
      }

      if (typeof priceMax === "string" && priceMax.trim() !== "") {
        const pMax = Number(priceMax);
        if (!Number.isNaN(pMax)) {
          filter.priceMax = pMax;
        }
      }

      if (typeof includeInactive === "string" && includeInactive.toLowerCase() === "true") {
        filter.includeInactive = true;
      }

      if (typeof status === "string" && status.trim() !== "") {
        filter.status = status as any;
      }

      const products = await productService.listProducts(filter);
      res.json(products);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      const product = await productService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body || {};
    const categoryId = Number(body.category_id ?? body.categoryId ?? 0);
    const brandId = Number(body.brand_id ?? body.brandId ?? 0);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "category_id phải là số nguyên dương hợp lệ" });
    }
    if (!Number.isInteger(brandId) || brandId <= 0) {
      return res.status(400).json({ message: "brand_id phải là số nguyên dương hợp lệ" });
    }

    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      return res.status(400).json({ message: `category_id ${categoryId} không tồn tại` });
    }

    const created = await productService.createProduct({
      category_id: categoryId,
      brand_id: brandId,
      name: String(body.name ?? ""),
      price: Number(body.price ?? 0),
      stock: Number(body.stock ?? 0),
      warranty_month: body.warranty_month ?? body.warrantyMonth ?? null,
      image: body.image ?? null,
      description: body.description ?? null,
      status: (body.status as any) ?? "ACTIVE",
      original_price: body.original_price ?? body.originalPrice ?? null,
    });
    res.status(201).json(created);
  } catch (err: any) {
    console.error("[POST /api/products] failed", err);
    res.status(500).json({ message: err?.message || "Cannot create product" });
  }
});

router.put("/:id", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid product id" });

    let categoryIdToUse: number | undefined = undefined;
    if (req.body.category_id !== undefined || req.body.categoryId !== undefined) {
      const cid = Number(req.body.category_id ?? req.body.categoryId);
      if (!Number.isInteger(cid) || cid <= 0) {
        return res.status(400).json({ message: "category_id phải là số nguyên dương hợp lệ" });
      }

      const category = await categoryService.getCategoryById(cid);
      if (!category) {
        return res.status(400).json({ message: `category_id ${cid} không tồn tại` });
      }
      categoryIdToUse = cid;
    }

    let brandIdToUse: number | undefined = undefined;
    if (req.body.brand_id !== undefined || req.body.brandId !== undefined) {
      const bid = Number(req.body.brand_id ?? req.body.brandId);
      if (!Number.isInteger(bid) || bid <= 0) {
        return res.status(400).json({ message: "brand_id phải là số nguyên dương hợp lệ" });
      }
      brandIdToUse = bid;
    }

    const updated = await productService.updateProduct(id, {
      category_id: categoryIdToUse ?? req.body.category_id ?? req.body.categoryId,
      brand_id: brandIdToUse ?? req.body.brand_id ?? req.body.brandId,
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      warranty_month: req.body.warranty_month ?? req.body.warrantyMonth,
      image: req.body.image,
      description: req.body.description,
      status: req.body.status,
      original_price: req.body.original_price ?? req.body.originalPrice,
    });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err: any) {
    console.error("[PUT /api/products/:id] failed", err);
    res.status(500).json({ message: err?.message || "Cannot update product" });
  }
});

router.delete("/:id", requireAuth, ensureAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid product id" });
    const result = await productService.deleteProduct(id);
    if (result.blockedByReference) {
      // Soft delete already performed in service; report accordingly
      return res.status(200).json({
        success: true,
        deactivated: true,
        message:
          "San pham dang duoc tham chieu, da chuyen sang trang thai INACTIVE va an kho de tranh loi khoa ngoai.",
      });
    }
    if (!result.deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/products/:id] failed", err);
    res.status(500).json({ message: err?.message || "Cannot delete product" });
  }
});

export default router;
