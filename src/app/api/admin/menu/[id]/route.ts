import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { updateMenuItem, deleteMenuItem } from "@/lib/repo";

const schema = z.object({
  category: z.string().min(1).max(60).optional(),
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(500).optional().nullable(),
  available: z.number().int().min(0).max(1).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const item = await updateMenuItem(id, parsed.data);
  if (!item) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteMenuItem(id);
  return NextResponse.json({ ok: true });
}
