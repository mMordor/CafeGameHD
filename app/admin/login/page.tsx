import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin/AdminLogin";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (readSession()) redirect("/admin");
  return <AdminLogin />;
}
