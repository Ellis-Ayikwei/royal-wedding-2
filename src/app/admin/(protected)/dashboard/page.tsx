import { guestStats, listEvents, getMenuSettings, getStreamSettings } from "@/lib/repo";
import { DashboardView } from "@/components/admin/DashboardView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Estate Office" };

export default async function DashboardPage() {
  const [stats, events, menuSettings, streamSettings] = await Promise.all([
    guestStats(),
    listEvents(),
    getMenuSettings(),
    getStreamSettings(),
  ]);

  return (
    <DashboardView
      stats={stats}
      eventCount={events.length}
      menuMode={menuSettings.visibilityMode}
      streamEnabled={streamSettings.enabled === 1}
    />
  );
}
