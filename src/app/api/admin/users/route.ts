import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  countAdminUsers,
  createAdminUser,
  deleteAdminUser,
  getCurrentAdmin,
  isEmailTakenByOther,
  listAdminUsers,
  updateAdminAccount,
} from "@/lib/auth";

const createSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

const updateSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(200).optional(),
}).refine((data) => data.email || data.password, { message: "Nothing to update." });

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  return admin;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ admins: await listAdminUsers() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid details." }, { status: 400 });
  if (await isEmailTakenByOther(parsed.data.email, "")) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }
  try {
    return NextResponse.json({ admin: await createAdminUser(parsed.data.email, parsed.data.password) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const parsed = updateSchema.safeParse(body);
  if (!id || !parsed.success) return NextResponse.json({ error: parsed.success ? "Missing user id." : parsed.error.issues[0]?.message || "Invalid details." }, { status: 400 });
  if (parsed.data.email && await isEmailTakenByOther(parsed.data.email, id)) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }
  try {
    return NextResponse.json({ admin: await updateAdminAccount(id, parsed.data) });
  } catch {
    return NextResponse.json({ error: "Could not update that user." }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  const current = await requireAdmin();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  if (id === current.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  if ((await countAdminUsers()) <= 1) return NextResponse.json({ error: "At least one admin account must remain." }, { status: 400 });
  await deleteAdminUser(id);
  return NextResponse.json({ ok: true });
}