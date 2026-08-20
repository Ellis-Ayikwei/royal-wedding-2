import { getVenue } from "@/lib/repo";
import { VenueManager } from "@/components/admin/VenueManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venue | Estate Office" };

export default async function VenuePage() {
  return <VenueManager initialVenue={await getVenue()} />;
}
