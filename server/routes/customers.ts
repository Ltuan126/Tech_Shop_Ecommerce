import { Router } from "express";
import * as customerService from "../services/customerService";

const router = Router();

// GET /api/customers
router.get("/", async (req, res) => {
    const filter = {
        keyword: req.query.keyword || "",
        city: req.query.city || "",
    };
    const data = await customerService.listCustomers(filter);
    res.json(data);
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const data = await customerService.getCustomerById(id);
    res.json(data);
});

export default router;
