"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { EventPhoto } from "@/lib/types";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function Avatar({ name }: { name: string | null }) {
  const initial = (name || "G").trim().charAt(0).toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 text-xs font-semibold">
      {initial}
    </span>
  );
}

export function PhotoWall({ photos }: { photos: EventPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border border-dashed border-gold-400/20 rounded-2xl">
        <ImageOff className="text-gold-400/50" size={26} />
        <p className="font-display text-lg text-ivory-50">No photos yet</p>
        <p className="text-sm text-ivory-100/50 max-w-xs">
          Be the first to share a moment from the celebration.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence initial={false}>
          {photos.map((photo, i) => (
            <motion.button
              key={photo.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveIndex(i)}
              className="text-left rounded-2xl overflow-hidden border border-gold-400/15 bg-navy-900/50 hover:border-gold-400/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-300"
            >
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <Avatar name={photo.uploaderName} />
                <div className="min-w-0">
                  <p className="text-sm text-ivory-50 truncate">{photo.uploaderName || "A guest"}</p>
                  <p className="text-[11px] text-ivory-100/40">{relativeTime(photo.createdAt)}</p>
                </div>
              </div>
              <div className="relative aspect-square w-full bg-navy-950">
                <Image
                  src={photo.url}
                  alt={photo.caption || "Guest photo"}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {photo.caption && (
                <p className="px-3.5 py-3 text-sm text-ivory-100/75 leading-relaxed">{photo.caption}</p>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setActiveIndex(null)}
          >
            <button
              aria-label="Close"
              className="absolute top-6 right-6 text-gold-200 hover:text-gold-300"
              onClick={() => setActiveIndex(null)}
            >
              <X size={26} />
            </button>
            <button
              aria-label="Previous photo"
              className="absolute left-3 sm:left-8 text-gold-200 hover:text-gold-300 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((activeIndex - 1 + photos.length) % photos.length);
              }}
            >
              <ChevronLeft size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-2xl w-full"
            >
              <div className="relative w-full max-h-[70vh] aspect-square rounded-lg overflow-hidden border border-gold-400/20">
                <Image
                  src={photos[activeIndex].url}
                  alt={photos[activeIndex].caption || "Guest photo"}
                  fill
                  sizes="90vw"
                  className="object-contain bg-navy-950"
                />
              </div>
              <div className="flex items-center gap-2.5 mt-4">
                <Avatar name={photos[activeIndex].uploaderName} />
                <div>
                  <p className="text-sm text-ivory-50">{photos[activeIndex].uploaderName || "A guest"}</p>
                  <p className="text-[11px] text-ivory-100/40">{relativeTime(photos[activeIndex].createdAt)}</p>
                </div>
              </div>
              {photos[activeIndex].caption && (
                <p className="mt-2 text-sm text-ivory-100/75 leading-relaxed">{photos[activeIndex].caption}</p>
              )}
            </motion.div>
            <button
              aria-label="Next photo"
              className="absolute right-3 sm:right-8 text-gold-200 hover:text-gold-300 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((activeIndex + 1) % photos.length);
              }}
            >
              <ChevronRight size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
