import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { listGuests, createGuest } from "@/lib/repo";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(5).max(30),
  guestCount: z.number().int().min(1).max(20).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ guests: await listGuests() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid guest details." }, { status: 400 });
  const guest = await createGuest(parsed.data);
  return NextResponse.json({ guest });
}
