import { getEvents } from "@/actions/event.actions";
import { ExportPanel } from "./export-panel";
import { Download } from "lucide-react";

export default async function AdminExportDataPage() {
  const events = await getEvents();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Download className="h-8 w-8 text-indigo-400" />
          <span>Export Registration Data</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Flatten and download registration data, payment details, and team member logs in Excel format.
        </p>
      </div>

      {/* Export Panel Client Wrapper */}
      <ExportPanel events={events.map((e) => ({ id: e.id, name: e.name }))} />
    </div>
  );
}
