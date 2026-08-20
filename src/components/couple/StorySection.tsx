"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "../ui/primitives";

const MILESTONES = [
  { year: "2023", label: "A First Meeting in Accra" },
  { year: "2024", label: "Building a Life Together" },
  { year: "2025", label: "A Proposal" },
  { year: "2026", label: "The Wedding" },
];

export function StorySection({
  title,
  body,
  heroImage,
}: {
  title: string;
  body: string;
  heroImage: string;
}) {
  return (
    <section id="story" className="relative py-24 sm:py-32 px-6 bg-navy-950">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-gold-400/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="The couple" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 to-transparent" />
          </div>
          <div className="hidden sm:block absolute -bottom-6 -right-6 h-32 w-32 border border-emerald-400/50 rounded-sm -z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl text-ivory-50 font-medium">
            {title}
          </h2>
          <p className="mt-6 text-ivory-100/70 leading-relaxed text-[15px] sm:text-base">
            {body}
          </p>

          <div className="mt-10 space-y-0">
            {MILESTONES.map((m) => (
              <div key={m.year} className="flex items-center gap-5 py-3 border-b border-emerald-400/15 last:border-b-0">
                <span className="font-display italic text-gold-300 text-sm w-14 shrink-0">{m.year}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-ivory-100/70 text-sm">{m.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
