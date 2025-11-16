import { Router } from "express";
import { registerUser, loginUser, getCurrentUser, AuthError } from "../services/authService";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body ?? {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }
    const user = await registerUser({ fullName, email, password });
    res.status(201).json({ user });
  } catch (error) {
    console.error("[POST /api/auth/register] failed:", error);
    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Không thể đăng ký. Vui lòng thử lại." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }
    const user = await loginUser({ email, password });
    res.json({ user });
  } catch (error) {
    console.error("[POST /api/auth/login] failed:", error);
    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Không thể đăng nhập. Vui lòng thử lại." });
  }
});

router.get("/me", async (_req, res) => {
  const user = await getCurrentUser();
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(user);
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logout not implemented" });
});

export default router;
