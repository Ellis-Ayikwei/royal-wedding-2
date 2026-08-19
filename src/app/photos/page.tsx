import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSiteSettings, listPublicPhotos } from "@/lib/repo";
import { Monogram } from "@/components/ui/Monogram";
import { PhotosExperience } from "@/components/photos/PhotosExperience";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const names = settings.coupleNames || "The Royal Wedding";
  return {
    title: `Photo Wall | ${names}`,
    description: "Share your photos from the celebration and see everyone else's, live.",
  };
}

export default async function PhotosPage() {
  const [settings, photos] = await Promise.all([getSiteSettings(), listPublicPhotos()]);

  return (
    <div className="min-h-screen bg-navy-950">
      <header className="border-b border-gold-400/15 px-5 sm:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-gold-200">
            <Monogram className="h-7 w-7" />
            <span className="font-display italic text-sm tracking-wide hidden sm:inline">
              {settings.coupleNames || "Royal Wedding"}
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-ivory-100/60 hover:text-gold-300 transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="font-display italic text-xs tracking-[0.3em] uppercase text-gold-300">
            The Wall
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-display font-medium text-ivory-50">
            Share the moment
          </h1>
          <p className="mt-3 text-sm text-ivory-100/60 leading-relaxed">
            Snap a photo from the celebration and it will appear here for everyone to see.
          </p>
        </div>

        <PhotosExperience initialPhotos={photos} />
      </main>
    </div>
  );
}
