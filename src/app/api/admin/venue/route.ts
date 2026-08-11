import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { getVenue, updateVenue } from "@/lib/repo";

const schema = z.object({
  name: z.string().max(200).optional().nullable(),
  ceremonyLocation: z.string().max(300).optional().nullable(),
  receptionLocation: z.string().max(300).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  mapsUrl: z.string().max(2000).optional().nullable(),
  image: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ venue: await getVenue() });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid venue details." }, { status: 400 });
  return NextResponse.json({ venue: await updateVenue(parsed.data) });
}
