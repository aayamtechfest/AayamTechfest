import { prisma } from "@/lib/prisma";
import SocketSettingsForm from "./socket-settings-form";
import { Shield, Link, Database, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedDbUrl = dbUrl.replace(/:([^@]+)@/, ":******@");

  // Fetch settings from DB (shared with Aayam main website)
  const settings = await prisma.settings.findFirst().catch(() => null);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Platform Settings
        </h1>
        <p className="mt-1 text-gray-400">
          Configure real-time server connections, settings, and view diagnostic addresses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dynamic Socket Server Config (Replaces Password Form) */}
        <SocketSettingsForm initialSocketUrl={settings?.socketUrl || ""} />

        {/* Connection strings & diagnosis */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 h-fit">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Link className="h-5 w-5 text-indigo-400" />
            Platform Integration & Diagnostics
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
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Build Environment Socket URL</span>
              <div className="bg-black/25 border border-white/5 p-2 rounded-lg text-xs font-mono text-purple-300 mt-1">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </div>
            </div>

            {settings?.socketUrl && (
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold block">Runtime Override Socket URL</span>
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg text-xs font-mono text-emerald-300 mt-1">
                  {settings.socketUrl}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password warning/note section */}
      <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5 backdrop-blur-xl flex gap-3">
        <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white font-heading">Security & Credentials Note</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Admin credentials and password modifications can only be managed from the main Aayam website admin panel. This ensures single-sign-on (SSO) credentials remain strictly unified across the entire techfest platform.
          </p>
        </div>
      </div>
    </div>
  );
}
