import { changePasswordAction } from "@/actions/auth.actions";
import { Settings, Shield, Link, Database, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedDbUrl = dbUrl.replace(/:([^@]+)@/, ":******@");

  async function handlePasswordChange(formData: FormData) {
    "use server";
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      // Typically we'd use toast/feedback but since this is a simple action, we can return error or handle it.
      // For simplicity, we can log or trigger a direct check.
      return;
    }

    await changePasswordAction(currentPassword, newPassword);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Platform Settings
        </h1>
        <p className="mt-1 text-gray-400">
          Configure security, passwords, and audit connection strings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Change password card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Shield className="h-5 w-5 text-indigo-400" />
            Security & Passwords
          </h3>
          <p className="text-xs text-gray-400">
            Modify credentials to access the shared administration panel.
          </p>

          <form action={handlePasswordChange} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                name="newPassword"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
            >
              <Save className="h-4 w-4" />
              Save Password
            </button>
          </form>
        </div>

        {/* Connection strings & diagnosis */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 h-fit">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Link className="h-5 w-5 text-indigo-400" />
            Platform Integration
          </h3>
          <p className="text-xs text-gray-400">
            System diagnostics and connection addresses.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Shared database URL</span>
              <div className="flex items-center gap-2 bg-black/25 border border-white/5 p-2 rounded-lg text-xs font-mono text-gray-400 mt-1 truncate">
                <Database className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <span className="truncate" title={maskedDbUrl}>{maskedDbUrl}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Frontend Local URL</span>
              <div className="bg-black/25 border border-white/5 p-2 rounded-lg text-xs font-mono text-indigo-300 mt-1">
                {process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Socket.io Server URL</span>
              <div className="bg-black/25 border border-white/5 p-2 rounded-lg text-xs font-mono text-purple-300 mt-1">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
