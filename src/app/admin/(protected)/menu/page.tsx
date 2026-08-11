import { listMenuItems, getMenuSettings } from "@/lib/repo";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu — Estate Office" };

export default async function MenuPage() {
  const [items, settings] = await Promise.all([listMenuItems(), getMenuSettings()]);
  return <MenuManager initialItems={items} initialSettings={settings} />;
}
