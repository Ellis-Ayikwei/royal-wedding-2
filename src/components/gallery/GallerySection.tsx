"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "../ui/primitives";
import type { GalleryImage } from "@/lib/types";

export function GallerySection({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <section id="gallery" className="relative py-24 sm:py-32 px-6 bg-gradient-to-b from-navy-900 via-emerald-900/35 to-navy-900">
      <SectionHeading eyebrow="Moments" title="Gallery" />

      <div className="max-w-6xl mx-auto mt-14 columns-2 sm:columns-3 gap-3 space-y-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActiveIndex(i)}
            className="block w-full break-inside-avoid rounded-sm overflow-hidden border border-emerald-400/20 hover:border-emerald-400/50 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.title || ""}
              loading={i < 6 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
        ))}
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
              aria-label="Close gallery"
              className="absolute top-6 right-6 text-gold-200 hover:text-gold-300"
              onClick={() => setActiveIndex(null)}
            >
              <X size={26} />
            </button>
            <button
              aria-label="Previous image"
              className="absolute left-3 sm:left-8 text-gold-200 hover:text-gold-300 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((activeIndex - 1 + images.length) % images.length);
              }}
            >
              <ChevronLeft size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-4xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex].url}
                alt={images[activeIndex].title || ""}
                className="max-h-[85vh] w-auto rounded-sm border border-gold-400/20"
              />
            </motion.div>
            <button
              aria-label="Next image"
              className="absolute right-3 sm:right-8 text-gold-200 hover:text-gold-300 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((activeIndex + 1) % images.length);
              }}
            >
              <ChevronRight size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
