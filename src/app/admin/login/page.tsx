import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estate Office | Sign In" };

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/dashboard");
  return <LoginForm />;
}
