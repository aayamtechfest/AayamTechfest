import { getEvents } from "@/actions/event.actions";
import { AdminEventActions } from "./admin-event-actions";
import Link from "next/link";
import { Plus, Trophy, Calendar, Sparkles } from "lucide-react";

export default async function AdminEventsListPage() {
  const events = await getEvents();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="h-8 w-8 text-indigo-400" />
            <span>Manage Competitions</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Create, publish, edit, and configure the settings of your festival events.
          </p>
        </div>

        <Link
          href="/admin/events/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Events Table Container */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-md">
          <Trophy className="h-12 w-12 text-gray-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white">No Competitions Scaffolding</h3>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            Create your first competition to display on the platform landing page.
          </p>
          <Link
            href="/admin/events/new"
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
          >
            Add Competition
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Competition Name</th>
                  <th className="px-6 py-4">Participation Type</th>
                  <th className="px-6 py-4">Per Participant Fee</th>
                  <th className="px-6 py-4 text-center">Registrations</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((event) => {
                  const fee = event.registrationFee ? Number(event.registrationFee) : 0;
                  return (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{event.name}</span>
                          <span className="text-[11px] font-mono text-gray-500">
                            /{event.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <span className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs">
                          {event.participationType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {fee === 0 ? "Free" : `₹${fee}`}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-400">
                        {event._count.registrations}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              event.isPublished ? "bg-indigo-500 shadow-indigo-500/50" : "bg-gray-600"
                            }`}
                          />
                          <span className="text-xs">
                            {event.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <AdminEventActions
                          eventId={event.id}
                          isPublished={event.isPublished}
                          isRegistrationOpen={event.isRegistrationOpen}
                          eventName={event.name}
                          registrationsCount={event._count.registrations}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
