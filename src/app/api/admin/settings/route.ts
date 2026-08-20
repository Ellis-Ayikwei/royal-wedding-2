import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/repo";

const schema = z.object({
  coupleNames: z.string().max(200).optional().nullable(),
  weddingDate: z.string().max(40).optional().nullable(),
  heroImage: z.string().max(2000).optional().nullable(),
  heroTagline: z.string().max(300).optional().nullable(),
  storyTitle: z.string().max(200).optional().nullable(),
  storyBody: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSiteSettings() });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid site details." }, { status: 400 });
  return NextResponse.json({ settings: await updateSiteSettings(parsed.data) });
}
