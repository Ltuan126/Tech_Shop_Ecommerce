import { Router, Request, Response, NextFunction } from "express";
import * as categoryService from "../services/categoryService";

const router = Router();

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await categoryService.listCategories();
      res.json(categories);
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
        return res.status(400).json({ message: "Invalid category id" });
      }

      const category = await categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string") {
        return res
          .status(400)
          .json({ message: 'Field "name" is required and must be string' });
      }

      const newCategory = await categoryService.createCategory({ name });
      res.status(201).json(newCategory);
    } catch (err) {
      next(err);
    }
  }
);


router.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;

      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid category id" });
      }

      if (!name || typeof name !== "string") {
        return res
          .status(400)
          .json({ message: 'Field "name" is required and must be string' });
      }

      const updated = await categoryService.updateCategory(id, { name });
      if (!updated) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid category id" });
      }

      const ok = await categoryService.deleteCategory(id);
      if (!ok) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
