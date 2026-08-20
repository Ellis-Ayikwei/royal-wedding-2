"use client";

import Link from "next/link";
import { Check, Users } from "lucide-react";
import { RsvpProvider, useRsvp } from "../rsvp/RsvpProvider";
import { PrimaryButton } from "../ui/primitives";
import type { Guest } from "@/lib/types";

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
        <path d="M18 70h24l4 10v26l-4 10H18l-4-10V80l4-10Z" fill="url(#goldFill)" opacity="0.95" />
        <path d="M18 70h24l4 10v26l-4 10H18l-4-10V80l4-10Z" stroke="#f0dca8" strokeWidth="1" />
        {/* glass */}
        <rect x="21" y="76" width="18" height="36" rx="2" fill="#ffeec4" opacity="0.55" />
        <ellipse cx="30" cy="94" rx="6" ry="11" fill="#fff6dd" opacity="0.9" />
        {/* base */}
        <path d="M22 116h16l-2 7H24l-2-7Z" fill="url(#goldFill)" />
        <circle cx="30" cy="127" r="3" fill="#e6c983" />
      </g>
      <defs>
        <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a24b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#efdca0" stopOpacity="0.9" />
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
      <path d="M60 12c-14 6-22 12-26 20M60 12c14 6 22 12 26 20" stroke="#efdca0" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
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
      <span className="h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-gold-300/80" />
      <Heart className="h-3 w-3 text-gold-300/70" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-300" fill="currentColor">
        <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0Z" />
      </svg>
      <Heart className="h-3 w-3 text-gold-300/70" />
      <span className="h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-gold-300/80" />
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

  const date = weddingDate ? new Date(weddingDate) : null;
  const weekday = date?.toLocaleDateString("en-GB", { weekday: "long" }) ?? "";
  const month = date?.toLocaleDateString("en-GB", { month: "long" }) ?? "";
  const day = date ? String(date.getDate()) : "";
  const year = date ? String(date.getFullYear()) : "";

  const [first, second] = coupleNames.split("&").map((s) => s.trim());

  return (
    <div className="relative min-h-screen overflow-hidden bg-emerald-800 px-4 py-10 sm:py-16">
      {/* leafy ground */}
      <div className="absolute inset-0 pattern-leaf opacity-[0.35]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-transparent to-emerald-900/70" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-md border border-gold-300/30 bg-emerald-800 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 pattern-leaf opacity-30" aria-hidden="true" />
          <Arch className="absolute inset-x-0 top-0 h-full w-full text-emerald-900/45" />

          {/* lanterns */}
          <Lantern className="absolute left-2 sm:left-6 top-0 h-40 sm:h-56 w-10 sm:w-14 opacity-95" drop={0} />
          <Lantern className="absolute left-8 sm:left-20 top-0 h-52 sm:h-72 w-9 sm:w-12 opacity-80" drop={34} />
          <Lantern className="absolute right-2 sm:right-6 top-0 h-40 sm:h-56 w-10 sm:w-14 opacity-95" drop={0} />
          <Lantern className="absolute right-8 sm:right-20 top-0 h-52 sm:h-72 w-9 sm:w-12 opacity-80" drop={34} />

          {/* scattered hearts */}
          <Heart className="absolute left-[18%] top-[30%] h-3 w-3 text-gold-300/25" />
          <Heart className="absolute right-[16%] top-[38%] h-4 w-4 text-gold-300/20" />
          <Heart className="absolute left-[12%] bottom-[22%] h-3.5 w-3.5 text-gold-300/20" />
          <Heart className="absolute right-[13%] bottom-[28%] h-3 w-3 text-gold-300/25" />

          <div className="relative px-6 sm:px-14 pt-10 sm:pt-12 pb-12 text-center">
            <Bells className="mx-auto h-16 w-20 sm:h-20 sm:w-24 drop-shadow-[0_3px_10px_rgba(0,0,0,0.3)]" />

            <p className="mt-4 font-display text-ivory-100/85 text-sm sm:text-base">Join us to celebrate our</p>

            <h1 className="font-script text-gold-200 leading-[0.9] text-5xl sm:text-7xl mt-1 sm:mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
              Wedding Ceremony
            </h1>

            <p className="mt-8 sm:mt-10 font-display text-ivory-100/85 text-base sm:text-lg">
              Honouring our Bride &amp; Groom
            </p>
            <p className="mt-1 font-display text-gold-200 tracking-[0.06em] text-3xl sm:text-5xl uppercase">
              {first} <span className="text-gold-300/90">&amp;</span> {second}
            </p>

            <Divider />

            {/* date block */}
            <p className="font-display tracking-[0.42em] uppercase text-gold-200 text-sm sm:text-lg pl-[0.42em]">
              {month}
            </p>
            <div className="mt-2 flex items-center justify-center gap-3 sm:gap-5">
              <span className="hidden sm:block h-px flex-1 max-w-[120px] bg-gold-300/60" />
              <span className="font-display tracking-[0.2em] uppercase text-ivory-100/85 text-xs sm:text-sm">
                {weekday}
              </span>
              <span className="font-display text-gold-200 text-5xl sm:text-7xl leading-none">{day}</span>
              <span className="font-display tracking-[0.2em] uppercase text-ivory-100/85 text-xs sm:text-sm">
                {timeRange}
              </span>
              <span className="hidden sm:block h-px flex-1 max-w-[120px] bg-gold-300/60" />
            </div>
            <p className="mt-2 font-display text-gold-200 text-2xl sm:text-3xl">{year}</p>

            <p className="mt-6 font-display italic text-ivory-100/70 text-sm">at</p>
            <p className="mt-1 font-display font-semibold uppercase text-gold-200 text-base sm:text-xl leading-snug tracking-wide">
              {venueName}
              {venueAddress ? (
                <>
                  ,<br />
                  {venueAddress}
                </>
              ) : null}
            </p>

            <p className="mt-6 font-display text-ivory-100/75 text-sm sm:text-base">
              Traditional Ceremony &amp; White Wedding Ceremony
            </p>
            <p className="mt-1 font-display italic text-ivory-100/55 text-xs sm:text-sm">
              Both ceremonies will take place on the same day.
            </p>

            {/* personal panel */}
            <div className="mt-10 rounded-sm border border-gold-300/35 bg-emerald-900/50 px-6 py-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-ivory-100/55">
                This invitation is for
              </p>
              <p className="mt-2 font-display text-2xl sm:text-3xl text-ivory-50">{guest.name}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-200">
                <Users size={13} />
                {guest.guestCount > 1
                  ? `Admitting ${guest.guestCount} guests`
                  : "Admitting 1 guest"}
              </p>

              <div className="mt-6">
                {canRespond ? (
                  <PrimaryButton onClick={open}>Accept the Invitation</PrimaryButton>
                ) : (
                  <div className="rounded-sm border border-gold-300/30 bg-emerald-900/60 px-5 py-4">
                    <p className="inline-flex items-center gap-2 text-sm text-gold-200">
                      <Check size={16} />
                      {guest.rsvpStatus === "accepted"
                        ? guest.guestCount > 1
                          ? `Your attendance is confirmed for ${guest.guestCount} guests.`
                          : "Your attendance is confirmed."
                        : "You have let us know you cannot attend."}
                    </p>
                    <p className="mt-2 text-[11px] text-ivory-100/45">
                      To change your response, please contact the couple.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-8 font-display italic text-ivory-100/70 text-sm leading-relaxed">
              Above all these put on love, which binds
              <br className="hidden sm:block" /> everything together in perfect harmony.
            </p>
            <p className="mt-1 font-display italic text-gold-200/80 text-xs">Colossians 3:14</p>

            <p className="mt-8 font-display italic text-ivory-100/60 text-sm">By invitation only.</p>

            <Link
              href="/#events"
              className="inline-block mt-8 text-[11px] tracking-[0.25em] uppercase text-ivory-100/50 hover:text-gold-200 transition-colors"
            >
              View the full celebration
            </Link>
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
