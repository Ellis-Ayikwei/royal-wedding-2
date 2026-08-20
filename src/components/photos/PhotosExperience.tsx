"use client";

import { useEffect, useRef, useState } from "react";
import type { EventPhoto } from "@/lib/types";
import { PhotoUploadPanel } from "./PhotoUploadPanel";
import { PhotoWall } from "./PhotoWall";

const POLL_MS = 8000;

export function PhotosExperience({ initialPhotos }: { initialPhotos: EventPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const inFlight = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (inFlight.current || document.hidden) return;
      inFlight.current = true;
      try {
        const res = await fetch("/api/photos");
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos);
        }
      } catch {
        // A missed poll just means the wall waits for the next tick.
      } finally {
        inFlight.current = false;
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PhotoUploadPanel onUploaded={(photo) => setPhotos((current) => [photo, ...current])} />
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <p className="text-[11px] tracking-[0.2em] uppercase text-ivory-100/45">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} shared, updating live
          </p>
        </div>
        <PhotoWall photos={photos} />
      </div>
    </div>
  );
}
