import { RsvpProvider } from "@/components/rsvp/RsvpProvider";
import { SiteNav } from "@/components/navigation/SiteNav";
import { Hero } from "@/components/hero/Hero";
import { Countdown } from "@/components/countdown/Countdown";
import { StorySection } from "@/components/couple/StorySection";
import { EventsTimeline } from "@/components/events/EventsTimeline";
import { MenuSection } from "@/components/menu/MenuSection";
import { VenueSection } from "@/components/venue/VenueSection";
import { StreamingSection } from "@/components/streaming/StreamingSection";
import { SiteFooter } from "@/components/footer/SiteFooter";
import {
  getSiteSettings,
  listEvents,
  listMenuItems,
  getMenuSettings,
  isMenuVisible,
  listGalleryImages,
  getVenue,
  buildMapsUrl,
  getStreamSettings,
} from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const events = await listEvents();
  const menuItems = await listMenuItems();
  const menuSettings = await getMenuSettings();
  const gallery = await listGalleryImages();
  const venue = await getVenue();
  const stream = await getStreamSettings();

  const coupleNames = settings.coupleNames ?? "The Couple";
  const weddingDate = settings.weddingDate ?? new Date().toISOString();

  return (
    <RsvpProvider>
      <SiteNav coupleNames={coupleNames} />
      <main className="flex-1">
        <Hero
          coupleNames={coupleNames}
          tagline={settings.heroTagline ?? ""}
          heroImage={settings.heroImage ?? ""}
          weddingDate={weddingDate}
          venueName={venue.name ?? ""}
        />
        <Countdown weddingDate={weddingDate} />
        <StorySection
          title={settings.storyTitle ?? "Our Story"}
          body={settings.storyBody ?? ""}
          heroImage={gallery[0]?.url ?? settings.heroImage ?? ""}
        />
        <EventsTimeline events={events} />
        <MenuSection items={menuItems} settings={menuSettings} isVisible={isMenuVisible(menuSettings)} />
        {/* Photo wall hidden — gallery images still supply the story portrait above.
            Restore by rendering <GallerySection images={gallery} /> here and putting
            the "Gallery" links back in SiteNav and SiteFooter. */}
        <VenueSection venue={venue} mapsUrl={buildMapsUrl(venue)} weddingDate={weddingDate} />
        <StreamingSection stream={stream} />
      </main>
      <SiteFooter coupleNames={coupleNames} weddingDate={weddingDate} venueName={venue.name ?? ""} />
    </RsvpProvider>
  );
}
