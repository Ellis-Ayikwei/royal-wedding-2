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

export async function listAdminUsers(): Promise<AdminUser[]> {
  const db = await getDb();
  const res = await db.execute("SELECT id, email FROM admin_users ORDER BY email ASC");
  return res.rows as unknown as AdminUser[];
}

export async function createAdminUser(email: string, password: string): Promise<AdminUser> {
  const db = await getDb();
  const admin = { id: nanoid(), email };
  await db.execute({
    sql: "INSERT INTO admin_users (id, email, passwordHash) VALUES (?, ?, ?)",
    args: [admin.id, admin.email, bcrypt.hashSync(password, 10)],
  });
  return admin;
}

export async function deleteAdminUser(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM admin_sessions WHERE adminId = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM admin_users WHERE id = ?", args: [id] });
}

export async function countAdminUsers(): Promise<number> {
  const db = await getDb();
  const res = await db.execute("SELECT COUNT(*) as count FROM admin_users");
  return Number(res.rows[0]?.count ?? 0);
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

export async function verifyAdminPasswordById(id: string, password: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT passwordHash FROM admin_users WHERE id = ?", args: [id] });
  const row = res.rows[0] as unknown as { passwordHash: string } | undefined;
  if (!row) return false;
  return bcrypt.compareSync(password, row.passwordHash);
}

export async function isEmailTakenByOther(email: string, excludingId: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id FROM admin_users WHERE email = ? AND id != ?",
    args: [email, excludingId],
  });
  return res.rows.length > 0;
}

export async function updateAdminAccount(
  id: string,
  input: { email?: string; password?: string }
): Promise<AdminUser> {
  const db = await getDb();
  if (input.email) {
    await db.execute({ sql: "UPDATE admin_users SET email = ? WHERE id = ?", args: [input.email, id] });
  }
  if (input.password) {
    await db.execute({
      sql: "UPDATE admin_users SET passwordHash = ? WHERE id = ?",
      args: [bcrypt.hashSync(input.password, 10), id],
    });
  }
  const res = await db.execute({ sql: "SELECT id, email FROM admin_users WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as AdminUser;
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
