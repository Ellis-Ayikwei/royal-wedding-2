import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentAdmin,
  isEmailTakenByOther,
  updateAdminAccount,
  verifyAdminPasswordById,
} from "@/lib/auth";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    email: z.string().email().optional(),
    newPassword: z.string().min(8).max(200).optional(),
  })
  .refine((data) => data.email || data.newPassword, {
    message: "Nothing to update.",
  });

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid details." },
      { status: 400 }
    );
  }

  const ok = await verifyAdminPasswordById(admin.id, parsed.data.currentPassword);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  if (parsed.data.email) {
    const taken = await isEmailTakenByOther(parsed.data.email, admin.id);
    if (taken) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const updated = await updateAdminAccount(admin.id, {
    email: parsed.data.email,
    password: parsed.data.newPassword,
  });
  return NextResponse.json({ admin: updated });
}
