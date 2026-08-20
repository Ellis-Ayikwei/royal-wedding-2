import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { createPresignedUpload, UploadError } from "@/lib/storage";

const schema = z.object({ contentType: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Missing content type." }, { status: 400 });

  try {
    const result = await createPresignedUpload({ folder: "uploads", contentType: parsed.data.contentType });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not start the upload." }, { status: 500 });
  }
}
