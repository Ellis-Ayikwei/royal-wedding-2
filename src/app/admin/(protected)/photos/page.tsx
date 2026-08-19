import { headers } from "next/headers";
import QRCode from "qrcode";
import { listAllPhotos } from "@/lib/repo";
import { PhotosManager } from "@/components/admin/PhotosManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Photo Wall - Estate Office" };

async function resolvePhotosUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/photos`;
}

export default async function AdminPhotosPage() {
  const [photos, photosUrl] = await Promise.all([listAllPhotos(), resolvePhotosUrl()]);
  const qrDataUrl = await QRCode.toDataURL(photosUrl, {
    width: 480,
    margin: 2,
    color: { dark: "#0b1730", light: "#faf6ec" },
  });

  return <PhotosManager initialPhotos={photos} photosUrl={photosUrl} qrDataUrl={qrDataUrl} />;
}
