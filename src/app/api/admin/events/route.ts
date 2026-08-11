import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { listEvents, createEvent } from "@/lib/repo";

const schema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional().nullable(),
  eventDate: z.string().min(1),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.number().int().min(0).max(1).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ events: await listEvents() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event details." }, { status: 400 });
  const event = await createEvent({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime ?? null,
    endTime: parsed.data.endTime ?? null,
    location: parsed.data.location ?? null,
    image: parsed.data.image ?? null,
    sortOrder: parsed.data.sortOrder ?? 0,
    isFeatured: parsed.data.isFeatured ?? 0,
  });
  return NextResponse.json({ event });
}
