import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { getMenuSettings, updateMenuSettings } from "@/lib/repo";

const schema = z.object({
  visibilityMode: z.enum(["hidden", "visible", "scheduled"]),
  releaseAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getMenuSettings() });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  const settings = await updateMenuSettings(parsed.data);
  return NextResponse.json({ settings });
}
