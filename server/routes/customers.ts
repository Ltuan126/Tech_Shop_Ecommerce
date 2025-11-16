import { Router } from "express";
import { listCustomers, getCustomerById } from "../services/customerService";

const router = Router();

router.get("/", async (_req, res) => {
  const customers = await listCustomers();
  res.json(customers);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const customer = await getCustomerById(id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
});

export default router;
