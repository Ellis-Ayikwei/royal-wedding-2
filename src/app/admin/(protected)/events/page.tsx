import { listEvents } from "@/lib/repo";
import { EventsManager } from "@/components/admin/EventsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event Lineup | Estate Office" };

export default async function EventsPage() {
  return <EventsManager initialEvents={await listEvents()} />;
}
