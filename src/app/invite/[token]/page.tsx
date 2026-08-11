import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuestByToken, getSiteSettings, getVenue, listEvents } from "@/lib/repo";
import { InvitationClient } from "@/components/invitation/InvitationClient";

export const dynamic = "force-dynamic";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}.${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

/** "11AM TO 11PM" — the span of the day, taken from the scheduled events. */
function dayWindow(times: { startTime: string | null; endTime: string | null }[]) {
  const starts = times.map((e) => e.startTime).filter((t): t is string => !!t).sort();
  const ends = times.map((e) => e.endTime).filter((t): t is string => !!t).sort();
  if (!starts.length || !ends.length) return "";
  return `${formatTime(starts[0])} to ${formatTime(ends[ends.length - 1])}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  const settings = await getSiteSettings();
  if (!guest) {
    return { title: "Invitation Not Found" };
  }
  return {
    title: `An Invitation for ${guest.name} | ${settings.coupleNames}`,
    description: `${guest.name} is graciously invited to the wedding of ${settings.coupleNames}.`,
    openGraph: {
      title: `An Invitation for ${guest.name}`,
      description: `Join us in celebrating the wedding of ${settings.coupleNames}.`,
      images: settings.heroImage ? [settings.heroImage] : [],
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = await getGuestByToken(token);

  if (!guest) {
    notFound();
  }

  const [settings, venue, events] = await Promise.all([
    getSiteSettings(),
    getVenue(),
    listEvents(),
  ]);

  return (
    <InvitationClient
      guest={guest}
      coupleNames={settings.coupleNames ?? ""}
      weddingDate={settings.weddingDate ?? ""}
      venueName={venue.name ?? ""}
      venueAddress={venue.address ?? ""}
      timeRange={dayWindow(events)}
    />
  );
}
