import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { updateGuest, deleteGuest } from "@/lib/repo";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(5).max(30).optional(),
  guestCount: z.number().int().min(1).max(20).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const guest = await updateGuest(id, parsed.data);
  if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  return NextResponse.json({ guest });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteGuest(id);
  return NextResponse.json({ ok: true });
}
