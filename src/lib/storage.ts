import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type UploadFolder = "uploads" | "event-photos";

export const UPLOAD_LIMITS = {
  uploads: 8 * 1024 * 1024,
  "event-photos": 50 * 1024 * 1024,
} as const satisfies Record<UploadFolder, number>;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function extensionForContentType(contentType: string): string {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new UploadError("Unsupported file type. Use JPG, PNG, WEBP, GIF, SVG, HEIC, or HEIF.");
  }
  return ext;
}

function requiredEnv(): {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
} | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isR2Configured(): boolean {
  return requiredEnv() !== null;
}

let cachedClient: S3Client | null = null;
function r2Client(env: NonNullable<ReturnType<typeof requiredEnv>>): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
    });
  }
  return cachedClient;
}

const PRESIGN_TTL_SECONDS = 300;

// A plain presigned PUT (as opposed to a presigned POST policy) has no way to cap the
// byte count ahead of time, so the ceiling is only advisory here. It is re-checked for
// real in confirmUploadWithinLimit() once the object actually exists in the bucket.
export async function createPresignedUpload(opts: {
  folder: UploadFolder;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const env = requiredEnv();
  if (!env) throw new UploadError("Direct uploads are not configured on this deployment.", 501);
  const ext = extensionForContentType(opts.contentType);
  const key = `${opts.folder}/${nanoid(14)}.${ext}`;
  const client = r2Client(env);
  // ContentType is deliberately left off the signed command. Client-side HEIC
  // conversion or size-threshold recompression can still change the final bytes'
  // real type after this URL is issued; if ContentType were part of the signature,
  // the actual PUT would have to send back that exact header or fail with
  // SignatureDoesNotMatch. Leaving it unsigned lets the browser set whatever
  // Content-Type the final upload really is.
  const command = new PutObjectCommand({ Bucket: env.bucket, Key: key });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGN_TTL_SECONDS });
  const publicUrl = `${env.publicUrl.replace(/\/$/, "")}/${key}`;
  return { uploadUrl, publicUrl, key };
}

// Called once the browser reports a direct upload finished. Confirms the object is
// really there and within the size ceiling; deletes it and throws if not, since a
// presigned PUT can't enforce that up front the way Vercel Blob's token could.
export async function confirmUploadWithinLimit(publicUrl: string, maxBytes: number): Promise<void> {
  const env = requiredEnv();
  if (!env) return;
  const key = keyFromPublicUrl(publicUrl);
  if (!key) return;
  const client = r2Client(env);
  const head = await client.send(new HeadObjectCommand({ Bucket: env.bucket, Key: key }));
  if ((head.ContentLength ?? 0) > maxBytes) {
    await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }));
    throw new UploadError("That file is larger than the allowed limit.", 413);
  }
}

function keyFromPublicUrl(url: string): string | null {
  const env = requiredEnv();
  if (!env) return null;
  const base = env.publicUrl.replace(/\/$/, "");
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1);
}

export async function deleteObjectByUrl(url: string): Promise<void> {
  const env = requiredEnv();
  if (!env) return;
  const key = keyFromPublicUrl(url);
  if (!key) return;
  const client = r2Client(env);
  await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }));
}

// Local development fallback: no presigning involved, the file is written directly by
// the server process since there is no bucket to hand a signed URL out for.
export async function saveLocalUpload(
  folder: UploadFolder,
  contentType: string,
  bytes: Buffer
): Promise<string> {
  const ext = extensionForContentType(contentType);
  const filename = `${nanoid(14)}.${ext}`;
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/${folder}/${filename}`;
}

export async function deleteLocalUpload(url: string): Promise<void> {
  if (!url.startsWith("/uploads/") && !url.startsWith("/event-photos/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  await import("fs/promises").then((fs) => fs.unlink(filePath).catch(() => undefined));
}
