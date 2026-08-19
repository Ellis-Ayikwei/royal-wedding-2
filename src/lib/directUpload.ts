import { looksLikeHeicByName, prepareUpload } from "./imageCompress";

export type UploadStage = "converting" | "resizing" | "uploading";

export type DirectUploadResult =
  | { mode: "direct"; publicUrl: string }
  | { mode: "fallback" };

function xhrPut(url: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Could not reach storage. Please try again."));
    xhr.send(file);
  });
}

// Requests a presigned upload URL, runs HEIC conversion / size-threshold compression on
// the file, then PUTs it straight to storage - the file never passes through our own
// server. If storage isn't configured (local dev without R2 credentials), the URL
// endpoint responds 501 and this resolves to { mode: "fallback" } so the caller can
// submit the file through its own direct-POST endpoint instead.
export async function uploadDirect(
  file: File,
  urlEndpoint: string,
  onStage?: (stage: UploadStage) => void,
  onProgress?: (percent: number) => void
): Promise<DirectUploadResult> {
  const guessedContentType = looksLikeHeicByName(file) ? "image/jpeg" : file.type || "image/jpeg";

  const tokenRes = await fetch(urlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: guessedContentType }),
  });
  if (tokenRes.status === 501) return { mode: "fallback" };
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error || "Could not start the upload.");

  const { file: prepared } = await prepareUpload(file, onStage);

  onStage?.("uploading");
  await xhrPut(tokenData.uploadUrl, prepared, onProgress);

  return { mode: "direct", publicUrl: tokenData.publicUrl };
}
