import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f23]">
      {/* Sidebar */}
      <AdminSidebar
        adminName={session.adminName}
        adminEmail={session.adminEmail}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
