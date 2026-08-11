"use client";

import { MapPin, Navigation } from "lucide-react";
import { SectionHeading, PrimaryButton } from "../ui/primitives";
import type { Venue } from "@/lib/types";

export function VenueSection({ venue, mapsUrl, weddingDate }: { venue: Venue; mapsUrl: string; weddingDate: string }) {
  const formattedDate = new Date(weddingDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section id="venue" className="relative py-24 sm:py-32 px-6 bg-navy-950">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-0 rounded-md overflow-hidden border border-emerald-400/30">
        <div className="relative min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.image ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
        </div>

        <div className="bg-gradient-to-br from-navy-900 to-emerald-900/40 p-8 sm:p-12 flex flex-col justify-center">
          <SectionHeading eyebrow="Where" title={venue.name ?? "The Venue"} />
          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-ivory-50 text-sm font-medium">Ceremony</p>
                <p className="text-ivory-100/60 text-sm">{venue.ceremonyLocation}</p>
              </div>
            </div>
            {venue.receptionLocation && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-ivory-50 text-sm font-medium">Reception</p>
                  <p className="text-ivory-100/60 text-sm">{venue.receptionLocation}</p>
                </div>
              </div>
            )}
            <div className="rule-gold-solid" />
            <p className="text-ivory-100/60 text-sm">{formattedDate}</p>
            <p className="text-ivory-100/60 text-sm">{venue.address}</p>
          </div>

          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block w-fit">
            <PrimaryButton>
              <Navigation size={14} /> Get Directions
            </PrimaryButton>
          </a>
        </div>
      </div>
    </section>
  );
}
