import { getCurrentAdmin, listAdminUsers } from "@/lib/auth";
import { AdminAccountManager } from "@/components/admin/AdminAccountManager";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account - Estate Office" };

export default async function AccountPage() {
  const admin = await getCurrentAdmin();
  const users = await listAdminUsers();
  return (
    <>
      <AdminAccountManager email={admin?.email ?? ""} />
      <AdminUsersManager initialUsers={users} currentId={admin?.id ?? ""} />
    </>
  );
}
