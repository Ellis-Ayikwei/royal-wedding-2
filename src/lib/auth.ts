import { getDb } from "./db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

const SESSION_COOKIE = "royal_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AdminUser {
  id: string;
  email: string;
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM admin_users WHERE email = ?", args: [email] });
  const row = res.rows[0] as unknown as { id: string; email: string; passwordHash: string } | undefined;
  if (!row) return null;
  const ok = bcrypt.compareSync(password, row.passwordHash);
  if (!ok) return null;
  return { id: row.id, email: row.email };
}

export async function createSession(adminId: string): Promise<string> {
  const db = await getDb();
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.execute({
    sql: "INSERT INTO admin_sessions (token, adminId, expiresAt) VALUES (?, ?, ?)",
    args: [token, adminId, expiresAt],
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM admin_sessions WHERE token = ?", args: [token] });
}

export async function getSessionAdmin(token: string | undefined): Promise<AdminUser | null> {
  if (!token) return null;
  const db = await getDb();
  const sessionRes = await db.execute({
    sql: "SELECT * FROM admin_sessions WHERE token = ?",
    args: [token],
  });
  const session = sessionRes.rows[0] as unknown as
    | { token: string; adminId: string; expiresAt: string }
    | undefined;
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }
  const adminRes = await db.execute({
    sql: "SELECT id, email FROM admin_users WHERE id = ?",
    args: [session.adminId],
  });
  return (adminRes.rows[0] as unknown as AdminUser | undefined) ?? null;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getSessionAdmin(token);
}

export async function requireAdminFromRequest(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<AdminUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return getSessionAdmin(token);
}

export { SESSION_COOKIE, SESSION_TTL_MS };
