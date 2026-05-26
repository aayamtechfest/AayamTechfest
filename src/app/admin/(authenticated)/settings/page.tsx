import { getSettings } from "@/actions/settings.actions";
import { SettingsForm } from "./settings-form";
import { Settings as SettingsIcon } from "lucide-react";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-indigo-400" />
          <span>Portal Settings</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Modify the general branding metadata, payment details, QR code images, and contact footers.
        </p>
      </div>

      {/* Settings Form client component wrapper */}
      <SettingsForm settings={settings} />
    </div>
  );
}
