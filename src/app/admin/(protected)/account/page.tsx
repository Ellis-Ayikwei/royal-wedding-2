import { getCurrentAdmin } from "@/lib/auth";
import { AdminAccountManager } from "@/components/admin/AdminAccountManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account - Estate Office" };

export default async function AccountPage() {
  const admin = await getCurrentAdmin();
  return <AdminAccountManager email={admin?.email ?? ""} />;
}
