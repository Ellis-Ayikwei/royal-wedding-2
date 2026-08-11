import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuestByToken, getSiteSettings, getVenue } from "@/lib/repo";
import { InvitationClient } from "@/components/invitation/InvitationClient";

export const dynamic = "force-dynamic";

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
  const settings = await getSiteSettings();
  const venue = await getVenue();

  if (!guest) {
    notFound();
  }

  return (
    <InvitationClient
      guest={guest}
      coupleNames={settings.coupleNames ?? ""}
      weddingDate={settings.weddingDate ?? ""}
      heroImage={settings.heroImage ?? ""}
      venueName={venue.name ?? ""}
    />
  );
}
