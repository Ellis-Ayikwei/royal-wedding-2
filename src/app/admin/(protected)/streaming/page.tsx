import { getStreamSettings } from "@/lib/repo";
import { StreamingManager } from "@/components/admin/StreamingManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Stream | Estate Office" };

export default async function StreamingPage() {
  return <StreamingManager initialSettings={await getStreamSettings()} />;
}
