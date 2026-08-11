import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { listMenuItems, createMenuItem } from "@/lib/repo";

const schema = z.object({
  category: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional().nullable(),
  available: z.number().int().min(0).max(1).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listMenuItems() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid menu item." }, { status: 400 });
  const item = await createMenuItem({
    category: parsed.data.category,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    available: parsed.data.available ?? 1,
    sortOrder: parsed.data.sortOrder ?? 0,
  });
  return NextResponse.json({ item });
}
