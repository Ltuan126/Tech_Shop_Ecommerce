import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import customersRouter from "./routes/customers";
import authRouter from "./routes/auth";
import dashboardRouter from "./routes/dashboard";
import categoriesRouter from "./routes/categories";
import dealsRouter from "./routes/deals";
import cartRouter from "./routes/cart";
import supportRouter from "./routes/support";
import reviewsRouter from "./routes/reviews";

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/support", supportRouter);
app.use("/api/reviews", reviewsRouter);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
