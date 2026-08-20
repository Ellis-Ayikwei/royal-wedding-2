import { listGalleryImages } from "@/lib/repo";
import { GalleryManager } from "@/components/admin/GalleryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery | Estate Office" };

export default async function GalleryPage() {
  return <GalleryManager initialImages={await listGalleryImages()} />;
}
