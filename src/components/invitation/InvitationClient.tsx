"use client";

import Link from "next/link";
import { Check, Users } from "lucide-react";
import { RsvpProvider, useRsvp } from "../rsvp/RsvpProvider";
import { Monogram } from "../ui/Monogram";
import { PrimaryButton } from "../ui/primitives";
import type { Guest } from "@/lib/types";

function InvitationInner({
  guest,
  coupleNames,
  weddingDate,
  heroImage,
  venueName,
}: {
  guest: Guest;
  coupleNames: string;
  weddingDate: string;
  heroImage: string;
  venueName: string;
}) {
  const { open, canRespond } = useRsvp();
  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const statusLabel =
    guest.rsvpStatus === "accepted"
      ? "Attendance Confirmed"
      : guest.rsvpStatus === "declined"
        ? "Response Recorded"
        : "Awaiting Your Response";

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy-950/88" />
        <div className="absolute inset-0 pattern-dots opacity-[0.05]" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center card-glass rounded-md p-8 sm:p-14">
        <Monogram animate className="h-12 w-12 mx-auto text-gold-300" />

        <p className="mt-6 font-display italic text-xs tracking-[0.35em] uppercase text-gold-300">
          {statusLabel}
        </p>

        <h1 className="mt-5 font-display text-3xl sm:text-4xl text-ivory-50 leading-snug">
          Dear {guest.name},
        </h1>

        <p className="mt-5 text-ivory-100/70 text-sm sm:text-base leading-relaxed">
          You are graciously invited to witness the union of
        </p>
        <p className="mt-2 font-display text-2xl sm:text-3xl text-gold-gradient">{coupleNames}</p>

        <div className="mt-6 rule-gold w-32 mx-auto" />

        <p className="mt-6 text-ivory-100/70 text-sm">
          {formattedDate}
          {venueName ? ` · ${venueName}` : ""}
        </p>

        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-200">
          <Users size={13} />
          {guest.guestCount > 1
            ? `This invitation admits ${guest.guestCount} guests`
            : "This invitation admits 1 guest"}
        </p>

        <div className="mt-10">
          {canRespond ? (
            <PrimaryButton onClick={open}>Accept the Invitation</PrimaryButton>
          ) : (
            <div className="rounded-sm border border-emerald-400/30 bg-emerald-900/25 px-6 py-5">
              <p className="inline-flex items-center gap-2 text-sm text-emerald-200">
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

        <Link
          href="/#events"
          className="block mt-6 text-xs tracking-[0.2em] uppercase text-ivory-100/50 hover:text-emerald-300 transition-colors"
        >
          View the full celebration
        </Link>
      </div>
    </div>
  );
}

export function InvitationClient(props: {
  guest: Guest;
  coupleNames: string;
  weddingDate: string;
  heroImage: string;
  venueName: string;
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
