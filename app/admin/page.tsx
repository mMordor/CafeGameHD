import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Server-side gate: nobody without a valid, current session ever receives the dashboard.
export default function AdminPage() {
  const session = readSession();
  if (!session) redirect("/admin/login");
  return <AdminDashboard user={session.user} role={session.role} />;
}
