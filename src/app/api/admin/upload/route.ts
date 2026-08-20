import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { isR2Configured, saveLocalUpload, UploadError, UPLOAD_LIMITS } from "@/lib/storage";

// Local-development fallback only. When R2 is configured the client uploads directly
// via a presigned URL from /api/admin/upload-url instead, so the file never has to pass
// through this (or any) serverless function body.
export async function POST(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isR2Configured()) {
    return NextResponse.json({ error: "Use the direct upload endpoint instead." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was received." }, { status: 400 });
  }
  if (file.size > UPLOAD_LIMITS.uploads) {
    return NextResponse.json({ error: "Image is too large. Maximum size is 8MB." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveLocalUpload("uploads", file.type, buffer);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not save the image." }, { status: 500 });
  }
}
