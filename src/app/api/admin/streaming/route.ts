import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { getStreamSettings, updateStreamSettings } from "@/lib/repo";

const schema = z.object({
  platform: z.enum(["youtube", "zoom", "google_meet", "discord", "twitch", "custom"]),
  url: z.string().max(2000).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  enabled: z.number().int().min(0).max(1),
  startAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getStreamSettings() });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid stream settings." }, { status: 400 });
  return NextResponse.json({ settings: await updateStreamSettings(parsed.data) });
}
