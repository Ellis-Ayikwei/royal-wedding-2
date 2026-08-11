"use client";

import { motion } from "framer-motion";
import { Monogram } from "../ui/Monogram";
import { useRsvp } from "../rsvp/RsvpProvider";

export function Hero({
  coupleNames,
  tagline,
  heroImage,
  weddingDate,
  venueName,
}: {
  coupleNames: string;
  tagline: string;
  heroImage: string;
  weddingDate: string;
  venueName: string;
}) {
  const { open, canRespond } = useRsvp();
  const date = new Date(weddingDate);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [first, second] = coupleNames.split("&").map((s) => s.trim());

  return (
    <section id="top" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-emerald-900/70 to-navy-950" />
        <div className="absolute inset-0 bg-navy-950/30" />
        <div className="absolute inset-0 pattern-dots opacity-[0.06]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 text-center max-w-4xl mx-auto pt-20"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="flex justify-center mb-6"
        >
          <Monogram animate className="h-14 w-14 text-gold-300" />
        </motion.div>

        <p className="font-display italic text-xs sm:text-sm tracking-[0.4em] uppercase text-gold-300 mb-6">
          The Royal Wedding
        </p>

        <h1 className="font-display font-medium text-gold-gradient leading-[0.95] text-5xl sm:text-7xl md:text-8xl">
          {first}
          <span className="block text-3xl sm:text-4xl md:text-5xl my-2 sm:my-3 italic text-ivory-100/80 font-normal">
            &amp;
          </span>
          {second}
        </h1>

        <div className="mt-8 rule-gold w-40 mx-auto" />

        <p className="mt-8 text-sm sm:text-base text-ivory-100/80 tracking-wide">
          {formattedDate.toUpperCase()} &nbsp;·&nbsp; {venueName.toUpperCase()}
        </p>

        <p className="mt-4 max-w-lg mx-auto text-ivory-100/60 text-sm sm:text-base italic font-display">
          {tagline}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {canRespond && (
            <button
              onClick={open}
              className="gold-shimmer inline-flex items-center justify-center px-8 py-4 bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 font-medium text-xs tracking-[0.25em] uppercase rounded-sm shadow-[0_4px_24px_rgba(201,162,75,0.3)]"
            >
              Accept the Invitation
            </button>
          )}
          <a
            href="#events"
            className="inline-flex items-center justify-center px-8 py-4 border border-emerald-400/70 text-emerald-200 font-medium text-xs tracking-[0.25em] uppercase rounded-sm hover:bg-emerald-500/15 transition-colors"
          >
            View Celebration
          </a>
        </div>

        {!canRespond && (
          <p className="mt-8 text-xs text-ivory-100/45 tracking-wide max-w-sm mx-auto leading-relaxed">
            Invitations are personal. Kindly respond using the link sent to you.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gold-300/70"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <span className="h-8 w-px bg-gold-300/50" />
      </motion.div>
    </section>
  );
}
