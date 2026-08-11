import { listGuests } from "@/lib/repo";
import { GuestsManager } from "@/components/admin/GuestsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guests — Estate Office" };

export default async function GuestsPage() {
  return <GuestsManager initialGuests={await listGuests()} />;
}
