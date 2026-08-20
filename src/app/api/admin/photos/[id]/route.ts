import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth";
import { deleteEventPhoto, getEventPhotoById, updatePhotoStatus } from "@/lib/repo";
import { deleteLocalUpload, deleteObjectByUrl, isR2Configured } from "@/lib/storage";

const schema = z.object({ status: z.enum(["visible", "hidden"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const photo = await updatePhotoStatus(id, parsed.data.status);
  if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  return NextResponse.json({ photo });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const photo = await getEventPhotoById(id);
  if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  try {
    if (isR2Configured()) {
      await deleteObjectByUrl(photo.url);
    } else {
      await deleteLocalUpload(photo.url);
    }
  } catch {
    // The DB row is still removed below even if the underlying file was already gone.
  }

  await deleteEventPhoto(id);
  return NextResponse.json({ ok: true });
}
