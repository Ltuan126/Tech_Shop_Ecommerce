import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2/promise";
import { pool, query } from "../../src/lib/db";

export interface UserRecord {
  id: number;
  fullName: string | null;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface PublicUser {
  id: number;
  fullName: string | null;
  email: string;
  role: "user" | "admin";
  createdAt: string;
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
    id,
    full_name AS fullName,
    email,
    password_hash AS passwordHash,
    role,
    created_at AS createdAt
  FROM users
`;

function toPublicUser(record: UserRecord): PublicUser {
  const { passwordHash, ...rest } = record;
  return rest;
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await query<UserRecord[]>(`${baseSelect} WHERE email = ? LIMIT 1`, [email]);
  return rows[0] ?? null;
}

export async function registerUser(payload: RegisterPayload): Promise<PublicUser> {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new AuthError("Email đã tồn tại", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
    [payload.fullName, payload.email, passwordHash]
  );

  const insertedId = result.insertId;
  const rows = await query<UserRecord[]>(`${baseSelect} WHERE id = ?`, [insertedId]);
  if (!rows[0]) {
    throw new AuthError("Không thể tạo tài khoản", 500);
  }
  return toPublicUser(rows[0]);
}

export async function loginUser(payload: LoginPayload): Promise<PublicUser> {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash ?? "");
  if (!isValid) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  return toPublicUser(user);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  return null;
}
