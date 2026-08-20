// Runs entirely in the browser. Guests (and the admin image picker) can hand this a
// raw phone photo of any format or size; by the time it resolves, the caller has a
// JPEG under a few MB with a content type that matches what actually gets uploaded.

const RESIZE_THRESHOLD_BYTES = 4 * 1024 * 1024;
const MAX_EDGE_PX = 2560;
const RESIZE_QUALITY = 0.86;

function withJpegExtension(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}.jpg`;
}

// Cheap, synchronous-ish check used before requesting an upload URL, so the server
// knows the eventual content type up front. The heavier content-sniffing isHeic() from
// heic-to runs later, right before the actual conversion, in case the extension lied.
export function looksLikeHeicByName(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.hei[cf]$/i.test(file.name)
  );
}

export async function isActuallyHeic(file: File): Promise<boolean> {
  if (looksLikeHeicByName(file)) return true;
  const { isHeic } = await import("heic-to");
  return isHeic(file);
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import("heic-to");
  const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  return new File([blob], withJpegExtension(file.name), { type: "image/jpeg" });
}

async function resizeToJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", RESIZE_QUALITY)
  );
  if (!blob) return file;
  return new File([blob], withJpegExtension(file.name), { type: "image/jpeg" });
}

export interface PrepareResult {
  file: File;
  didConvertHeic: boolean;
}

// Format check first (HEIC can't display anywhere or be resized by the browser until
// it's a normal raster format), then the existing 4MB-threshold size check, untouched
// below that threshold.
export async function prepareUpload(
  input: File,
  onStage?: (stage: "converting" | "resizing") => void
): Promise<PrepareResult> {
  let file = input;
  let didConvertHeic = false;

  if (await isActuallyHeic(file)) {
    onStage?.("converting");
    file = await convertHeicToJpeg(file);
    didConvertHeic = true;
  }

  if (file.size > RESIZE_THRESHOLD_BYTES) {
    onStage?.("resizing");
    file = await resizeToJpeg(file);
  }

  return { file, didConvertHeic };
}
