"use client";

import { Monogram } from "../ui/Monogram";
import { useRsvp } from "../rsvp/RsvpProvider";

export function SiteFooter({ coupleNames, weddingDate, venueName }: { coupleNames: string; weddingDate: string; venueName: string }) {
  const { open, canRespond } = useRsvp();
  const year = new Date(weddingDate).getFullYear();

  return (
    <footer className="relative bg-navy-950 border-t border-emerald-400/15 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <Monogram className="h-10 w-10 mx-auto text-gold-300" />
        <h3 className="mt-5 font-display italic text-2xl text-ivory-50">{coupleNames}</h3>
        <p className="mt-2 text-xs tracking-[0.2em] uppercase text-ivory-100/50">{venueName}</p>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs tracking-[0.15em] uppercase text-ivory-100/60">
          <a href="#story" className="hover:text-gold-300 transition-colors">Our Story</a>
          <a href="#events" className="hover:text-gold-300 transition-colors">Events</a>
          <a href="#menu" className="hover:text-gold-300 transition-colors">Menu</a>
          <a href="#gallery" className="hover:text-gold-300 transition-colors">Gallery</a>
          <a href="#venue" className="hover:text-gold-300 transition-colors">Location</a>
        </nav>

        {canRespond && (
          <button
            onClick={open}
            className="mt-8 inline-flex items-center px-6 py-3 border border-gold-300/60 text-gold-200 text-xs tracking-[0.2em] uppercase rounded-sm hover:bg-gold-300/10 transition-colors"
          >
            Accept the Invitation
          </button>
        )}

        <div className="mt-10 rule-emerald-gold max-w-xs mx-auto" />
        <p className="mt-6 text-[11px] text-ivory-100/30 tracking-wide">
          &copy; {year} {coupleNames}. With love, gratitude, and gold leaf.
        </p>
      </div>
    </footer>
  );
}
