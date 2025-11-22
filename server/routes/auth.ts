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
    // Auto-login ngay sau khi đăng ký để trả về token cho frontend
    const loginResponse = await loginUser({ email, password });
    res.status(201).json(loginResponse); // { user, token }
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
    const response = await loginUser({ email, password });
    res.json(response); // Return { user, token }
  } catch (error) {
    console.error("[POST /api/auth/login] failed:", error);
    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Không thể đăng nhập. Vui lòng thử lại." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không tìm thấy token" });
    }

    const token = authHeader.split(" ")[1];
    const user = await getCurrentUser(token);

    if (!user) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    res.json({ user });
  } catch (error) {
    console.error("[GET /api/auth/me] failed:", error);
    res.status(500).json({ message: "Không thể xác thực" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logout not implemented" });
});

export default router;
