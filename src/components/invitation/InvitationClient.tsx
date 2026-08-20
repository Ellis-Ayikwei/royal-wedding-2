"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Users } from "lucide-react";

import { RsvpProvider, useRsvp } from "../rsvp/RsvpProvider";
import { PrimaryButton } from "../ui/primitives";
import type { Guest } from "@/lib/types";

/**
 * The card is laid out once at this width and then scaled to fit the viewport, so the
 * whole invitation is visible at any screen size without scrolling. Laying out at a
 * phone width means small screens barely shrink it, while large screens scale it up.
 */
const CARD_WIDTH = 360;
const MAX_SCALE = 1.9;

function useFitToViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      // offsetWidth/Height are pre-transform, so this cannot feed back on itself.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const margin = vw < 420 ? 16 : 40;
      setScale(Math.min((vw - margin) / w, (vh - margin) / h, MAX_SCALE));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    window.addEventListener("resize", compute);
    window.visualViewport?.addEventListener("resize", compute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", compute);
      window.visualViewport?.removeEventListener("resize", compute);
    };
  }, []);

  return { ref, scale };
}


/* Decorative gold lantern hanging from a chain, echoing the printed invitation. */
function Lantern({ className = "", drop = 0 }: { className?: string; drop?: number }) {
  return (
    <svg
      viewBox="0 0 60 200"
      className={className}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMin meet"
    >
      <g transform={`translate(0 ${drop})`}>
        {/* chain */}
        <line x1="30" y1="0" x2="30" y2="62" stroke="url(#goldLine)" strokeWidth="1.5" strokeDasharray="5 4" />
        {/* crown */}
        <path d="M22 66h16l-3-6H25l-3 6Z" fill="url(#goldFill)" />
        {/* body */}
        <path d="M18 70h24l4 10v26l-4 10H18l-4-10V80l4-10Z" fill="url(#goldFill)" />
        <path d="M18 70h24l4 10v26l-4 10H18l-4-10V80l4-10Z" stroke="#f0dca8" strokeWidth="1" />
        {/* glass */}
        <rect x="21" y="76" width="18" height="36" rx="2" fill="#8a6f2e" />
        <ellipse cx="30" cy="94" rx="6" ry="11" fill="#fff6dd" />
        {/* base */}
        <path d="M22 116h16l-2 7H24l-2-7Z" fill="url(#goldFill)" />
        <circle cx="30" cy="127" r="3" fill="#e6c983" />
      </g>
      <defs>
        <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6f2e" />
          <stop offset="100%" stopColor="#efdca0" />
        </linearGradient>
        <linearGradient id="goldFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2e0ac" />
          <stop offset="50%" stopColor="#d9b869" />
          <stop offset="100%" stopColor="#b08c3c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* A soft rounded garden arch for the type to sit inside. */
function Arch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" className={className} fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path d="M44 560V200a156 156 0 0 1 312 0v360Z" fill="currentColor" />
    </svg>
  );
}

/* Pair of wedding bells with a ribbon bow, hung from the top of the card. */
function Bells({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 96" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bellGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2e0ac" />
          <stop offset="55%" stopColor="#d9b869" />
          <stop offset="100%" stopColor="#b08c3c" />
        </linearGradient>
      </defs>

      {/* ribbon */}
      <path d="M60 12c-14 6-22 12-26 20M60 12c14 6 22 12 26 20" stroke="#efdca0" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 12c-9-7-19-4-19 3 0 5 8 7 19 1Zm0 0c9-7 19-4 19 3 0 5-8 7-19 1Z" fill="url(#bellGold)" />
      <circle cx="60" cy="14" r="3.2" fill="#f6e7bb" />

      {/* left bell */}
      <g transform="rotate(-12 38 34)">
        <path d="M38 30c-11 0-17 9-18 20-1 8-3 12-6 15h48c-3-3-5-7-6-15-1-11-7-20-18-20Z" fill="url(#bellGold)" stroke="#f0dca8" strokeWidth="1" />
        <circle cx="38" cy="72" r="4.5" fill="#e6c983" />
      </g>

      {/* right bell */}
      <g transform="rotate(12 82 34)">
        <path d="M82 30c-11 0-17 9-18 20-1 8-3 12-6 15h48c-3-3-5-7-6-15-1-11-7-20-18-20Z" fill="url(#bellGold)" stroke="#f0dca8" strokeWidth="1" />
        <circle cx="82" cy="72" r="4.5" fill="#e6c983" />
      </g>
    </svg>
  );
}

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 21s-8.4-5.2-10.2-10A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 22.2 11C20.4 15.8 12 21 12 21Z" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-7" aria-hidden="true">
      <span className="h-px w-14 bg-gold-400" />
      <Heart className="h-3 w-3 text-gold-300" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-300" fill="currentColor">
        <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0Z" />
      </svg>
      <Heart className="h-3 w-3 text-gold-300" />
      <span className="h-px w-14 bg-gold-400" />
    </div>
  );
}

function InvitationInner({
  guest,
  coupleNames,
  weddingDate,
  venueName,
  venueAddress,
  timeRange,
}: {
  guest: Guest;
  coupleNames: string;
  weddingDate: string;
  venueName: string;
  venueAddress: string;
  timeRange: string;
}) {
  const { open, canRespond } = useRsvp();
  const { ref, scale } = useFitToViewport();

  const date = weddingDate ? new Date(weddingDate) : null;
  const weekday = date?.toLocaleDateString("en-GB", { weekday: "long" }) ?? "";
  const month = date?.toLocaleDateString("en-GB", { month: "long" }) ?? "";
  const day = date ? String(date.getDate()) : "";
  const year = date ? String(date.getFullYear()) : "";

  const [first, second] = coupleNames.split("&").map((s) => s.trim());

  return (
    <div className="fixed inset-0 overflow-hidden bg-emerald-800">
      {/* leafy ground */}
      <div className="absolute inset-0 pattern-leaf" aria-hidden="true" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={ref}
          style={{
            width: CARD_WIDTH,
            transform: `scale(${scale || 1})`,
            opacity: scale ? 1 : 0,
          }}
          className="origin-center transition-opacity duration-300"
        >
          <div className="relative overflow-hidden rounded-md border-2 border-gold-400 bg-emerald-800">
            <div className="absolute inset-0 pattern-leaf" aria-hidden="true" />
            <Arch className="absolute inset-x-0 top-0 h-full w-full text-emerald-900" />

            {/* lanterns */}
            <Lantern className="absolute left-1 top-0 h-32 w-8" drop={0} />
            <Lantern className="absolute left-7 top-0 h-40 w-7" drop={30} />
            <Lantern className="absolute right-1 top-0 h-32 w-8" drop={0} />
            <Lantern className="absolute right-7 top-0 h-40 w-7" drop={30} />

            {/* scattered hearts */}
            <Heart className="absolute left-[16%] top-[31%] h-2.5 w-2.5 text-emerald-700" />
            <Heart className="absolute right-[14%] top-[39%] h-3 w-3 text-emerald-700" />
            <Heart className="absolute left-[11%] bottom-[23%] h-3 w-3 text-emerald-700" />
            <Heart className="absolute right-[12%] bottom-[29%] h-2.5 w-2.5 text-emerald-700" />

            <div className="relative px-5 pt-6 pb-7 text-center">
              <Bells className="mx-auto h-12 w-16" />

              <p className="mt-2.5 font-display text-ivory-100 text-[11px]">Join us to celebrate our</p>

              <h1 className="font-script text-gold-200 leading-[0.95] text-[34px] mt-0.5">
                Wedding Ceremony
              </h1>

              <p className="mt-4 font-display text-ivory-100 text-[12px]">
                Honouring our Bride &amp; Groom
              </p>
              <p className="mt-0.5 font-display text-gold-200 tracking-[0.05em] text-[26px] leading-tight uppercase">
                {first} <span className="text-gold-300">&amp;</span> {second}
              </p>

              <Divider />

              {/* date block */}
              <p className="font-display tracking-[0.4em] uppercase text-gold-200 text-[12px] pl-[0.4em]">
                {month}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2.5">
                <span className="font-display tracking-[0.16em] uppercase text-ivory-100 text-[9px]">
                  {weekday}
                </span>
                <span className="font-display text-gold-200 text-[42px] leading-none">{day}</span>
                <span className="font-display tracking-[0.16em] uppercase text-ivory-100 text-[9px]">
                  {timeRange}
                </span>
              </div>
              <p className="mt-0.5 font-display text-gold-200 text-[17px]">{year}</p>

              <p className="mt-3 font-display italic text-ivory-100 text-[11px]">at</p>
              <p className="mt-0.5 font-display font-semibold uppercase text-gold-200 text-[12px] leading-snug tracking-wide">
                {venueName}
                {venueAddress ? (
                  <>
                    ,<br />
                    {venueAddress}
                  </>
                ) : null}
              </p>

              <p className="mt-3 font-display text-ivory-100 text-[11px] leading-snug">
                Traditional Ceremony &amp; White Wedding Ceremony
              </p>
              <p className="mt-0.5 font-display italic text-gold-200 text-[10px]">
                Both ceremonies will take place on the same day.
              </p>

              {/* personal panel */}
              <div className="mt-4 rounded-sm border border-gold-400 bg-emerald-900 px-4 py-3.5">
                <p className="text-[8px] tracking-[0.28em] uppercase text-gold-200">
                  This invitation is for
                </p>
                <p className="mt-1 font-display text-[18px] leading-tight text-ivory-50">{guest.name}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-gold-200">
                  <Users size={11} />
                  {guest.guestCount > 1
                    ? `Admitting ${guest.guestCount} guests`
                    : "Admitting 1 guest"}
                </p>

                <div className="mt-3">
                  {canRespond ? (
                    <PrimaryButton className="px-5 py-2.5 text-[10px]" onClick={open}>
                      Accept the Invitation
                    </PrimaryButton>
                  ) : (
                    <div className="rounded-sm border border-gold-400 bg-emerald-900 px-3 py-2.5">
                      <p className="inline-flex items-center gap-1.5 text-[11px] leading-snug text-gold-200">
                        <Check size={13} />
                        {guest.rsvpStatus === "accepted"
                          ? guest.guestCount > 1
                            ? `Your attendance is confirmed for ${guest.guestCount} guests.`
                            : "Your attendance is confirmed."
                          : "You have let us know you cannot attend."}
                      </p>
                      <p className="mt-1 text-[9px] text-gold-200">
                        To change your response, please contact the couple.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 font-display italic text-ivory-100 text-[10px] leading-relaxed">
                Above all these put on love, which binds everything together in perfect harmony.
              </p>
              <p className="mt-0.5 font-display italic text-gold-200 text-[9px]">Colossians 3:14</p>

              <p className="mt-3 font-display italic text-ivory-100 text-[11px]">By invitation only.</p>

              <Link
                href="/#events"
                className="inline-block mt-3 text-[9px] tracking-[0.22em] uppercase text-ivory-100 hover:text-gold-200 transition-colors"
              >
                View the full celebration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvitationClient(props: {
  guest: Guest;
  coupleNames: string;
  weddingDate: string;
  venueName: string;
  venueAddress: string;
  timeRange: string;
}) {
  const { guest } = props;
  return (
    <RsvpProvider
      invitation={{
        token: guest.invitationToken,
        name: guest.name,
        phone: guest.phone,
        guestCount: guest.guestCount,
        rsvpStatus: guest.rsvpStatus,
      }}
    >
      <InvitationInner {...props} />
    </RsvpProvider>
  );
}
