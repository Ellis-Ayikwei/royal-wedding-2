import { getSiteSettings } from "@/lib/repo";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Details | Estate Office" };

export default async function SettingsPage() {
  return <SettingsManager initialSettings={await getSiteSettings()} />;
}
