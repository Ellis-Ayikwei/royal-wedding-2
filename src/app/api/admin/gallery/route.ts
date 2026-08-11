import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { listGalleryImages, createGalleryImage } from "@/lib/repo";

const schema = z.object({
  url: z.string().min(1).max(2000),
  title: z.string().max(200).optional().nullable(),
  section: z.string().min(1).max(60).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ images: await listGalleryImages() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid image details." }, { status: 400 });
  const image = await createGalleryImage({
    url: parsed.data.url,
    title: parsed.data.title ?? null,
    section: parsed.data.section ?? "gallery",
    sortOrder: parsed.data.sortOrder ?? 0,
  });
  return NextResponse.json({ image });
}
