import { Request, Response, NextFunction } from "express";
import { getCurrentUser } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Thiếu token" });
    }
    const token = authHeader.split(" ")[1];
    const user = await getCurrentUser(token);
    if (!user) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    console.error("[requireAuth] error", err);
    return res.status(401).json({ message: "Không thể xác thực" });
  }
}
