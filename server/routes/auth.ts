import { Router } from "express";
import { registerUser, loginUser, getCurrentUser, AuthError } from "../services/authService";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

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

// PUT /api/auth/profile - Update user profile
router.put("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { email, password, fullName } = req.body;

    // Import db query
    const { query } = await import("../../src/lib/db");

    // Update user
    const updates: string[] = [];
    const values: any[] = [];

    if (email) {
      updates.push("email = ?");
      values.push(email);
    }

    if (fullName) {
      updates.push("full_name = ?");
      values.push(fullName);
    }

    if (password) {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Không có thông tin để cập nhật" });
    }

    values.push(userId);

    await query(
      `UPDATE user SET ${updates.join(", ")} WHERE user_id = ?`,
      values
    );

    // Get updated user
    const [updatedUser]: any = await query(
      "SELECT user_id, email, role, created_at FROM user WHERE user_id = ?",
      [userId]
    );

    res.json({ user: updatedUser });
  } catch (error: any) {
    console.error("[PUT /api/auth/profile] failed:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    res.status(500).json({ message: "Không thể cập nhật thông tin" });
  }
});

export default router;
