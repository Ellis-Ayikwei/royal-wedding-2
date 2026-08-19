import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEventPhoto, listPublicPhotos } from "@/lib/repo";
import { getClientIp } from "@/lib/http";
import { isRateLimited } from "@/lib/rateLimit";
import { confirmUploadWithinLimit, isR2Configured, saveLocalUpload, UploadError, UPLOAD_LIMITS } from "@/lib/storage";

function contentTypeForFile(file: File): string {
  if (file.type) return file.type;
  if (/\.mov$/i.test(file.name)) return "video/quicktime";
  if (/\.(mp4|m4v)$/i.test(file.name)) return "video/mp4";
  if (/\.webm$/i.test(file.name)) return "video/webm";
  if (/\.(hevc)$/i.test(file.name)) return "video/hevc";
  return "application/octet-stream";
}

const completeSchema = z.object({
  url: z.string().url(),
  mediaType: z.enum(["image", "video"]).default("image"),
  uploaderName: z.string().trim().max(80).optional().nullable(),
  caption: z.string().trim().max(280).optional().nullable(),
});

export async function GET() {
  return NextResponse.json({ photos: await listPublicPhotos() });
}

// Two modes, both rate-limited by IP:
// - JSON body: the browser already PUT the file straight to R2 via a presigned URL
//   (see /api/photos/upload-url) and is now handing over the public URL to save.
// - multipart/form-data: local-development fallback when R2 isn't configured, where
//   there's no bucket to presign against, so the file is written by this route.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many uploads from this device. Please try again later." },
      { status: 429 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    if (isR2Configured()) {
      return NextResponse.json({ error: "Use the direct upload endpoint instead." }, { status: 400 });
    }
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });

    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No photo was received." }, { status: 400 });
    if (file.size > UPLOAD_LIMITS["event-photos"]) {
      return NextResponse.json({ error: "That photo is larger than the allowed limit." }, { status: 413 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = contentTypeForFile(file);
      const url = await saveLocalUpload("event-photos", contentType, buffer);
      const photo = await createEventPhoto({
        url,
        mediaType: contentType.startsWith("video/") ? "video" : "image",
        uploaderName: (form.get("uploaderName") as string) || null,
        caption: (form.get("caption") as string) || null,
      });
      return NextResponse.json({ photo });
    } catch (err) {
      if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
      return NextResponse.json({ error: "Could not save the photo." }, { status: 500 });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid photo details." }, { status: 400 });

  const host = new URL(parsed.data.url).hostname;
  const r2Host = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;
  if (!r2Host || host !== r2Host) {
    return NextResponse.json({ error: "That photo did not come from an upload." }, { status: 400 });
  }

  try {
    await confirmUploadWithinLimit(parsed.data.url, UPLOAD_LIMITS["event-photos"]);
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const photo = await createEventPhoto({
    url: parsed.data.url,
    mediaType: parsed.data.mediaType,
    uploaderName: parsed.data.uploaderName || null,
    caption: parsed.data.caption || null,
  });
  return NextResponse.json({ photo });
}
