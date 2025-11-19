import { Router, Request, Response, NextFunction } from "express";
import * as productService from "../services/productService";

const router = Router();

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId, priceMin, priceMax } = req.query;

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

export default router;
