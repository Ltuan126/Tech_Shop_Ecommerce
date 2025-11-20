import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { ResultSetHeader } from "mysql2/promise";
import { pool, query } from "../../src/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-env";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface UserRecord {
  id: number;
  fullName: string | null;
  email: string;
  passwordHash: string;
  role: "USER" | "CUSTOMER" | "ADMIN";
}

export interface PublicUser {
  id: number;
  fullName: string | null;
  email: string;
  role: "USER" | "CUSTOMER" | "ADMIN";
}

export interface LoginResponse {
  user: PublicUser;
  token: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

const baseSelect = `
  SELECT
    user_id AS id,
    name AS fullName,
    email,
    password AS passwordHash,
    role
  FROM user
`;

function toPublicUser(record: UserRecord): PublicUser {
  const { passwordHash, ...rest } = record;
  return rest;
}

function generateToken(user: UserRecord): string {
  const payload = {
    userId: user.id.toString(),
    email: user.email,
    role: user.role.toUpperCase(),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await query<UserRecord[]>(`${baseSelect} WHERE email = ? LIMIT 1`, [email]);
  return rows[0] ?? null;
}

async function findUserById(id: number): Promise<UserRecord | null> {
  const rows = await query<UserRecord[]>(`${baseSelect} WHERE user_id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function registerUser(payload: RegisterPayload): Promise<PublicUser> {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new AuthError("Email đã tồn tại", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, 'USER')`,
    [payload.fullName, payload.email, passwordHash]
  );

  const insertedId = result.insertId;
  const rows = await query<UserRecord[]>(`${baseSelect} WHERE user_id = ?`, [insertedId]);
  if (!rows[0]) {
    throw new AuthError("Không thể tạo tài khoản", 500);
  }
  return toPublicUser(rows[0]);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Check if password is bcrypt hash or plaintext (for backward compatibility)
  let isValid = false;

  if (user.passwordHash?.startsWith('$2a$') || user.passwordHash?.startsWith('$2b$')) {
    // Bcrypt hash
    isValid = await bcrypt.compare(payload.password, user.passwordHash);
  } else {
    // Plaintext password (legacy, not secure)
    isValid = payload.password === user.passwordHash;
  }

  if (!isValid) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  const token = generateToken(user);

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function getCurrentUser(token: string): Promise<PublicUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = parseInt(decoded.userId, 10);

    if (!userId) {
      return null;
    }

    const user = await findUserById(userId);
    return user ? toPublicUser(user) : null;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}
