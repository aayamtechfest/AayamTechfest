import Link from "next/link";
import { ArrowRight, Trophy, Users, User, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightEvent {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  participationType: "SOLO" | "TEAM" | "BOTH";
  registrationFee: any; // Decimal type from Prisma
  isRegistrationOpen: boolean;
}

interface EventHighlightsProps {
  events: HighlightEvent[];
}

export function EventHighlights({ events }: EventHighlightsProps) {
  return (
    <section id="events" className="relative bg-[#0f0f23] py-24 border-y border-white/5">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Featured Competitions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
            Showcase your skills, collaborate with peers, and compete for prestige and cash prizes across various fields.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-12 text-center backdrop-blur-md">
            <Trophy className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400">No events published yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
            {events.map((event, index) => {
              const fee = event.registrationFee ? Number(event.registrationFee) : 0;
              return (
                <div
                  key={event.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:bg-white/10 animate-fade-in"
                >
                  <div>
                    {/* Badge Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border",
                          event.participationType === "SOLO"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : event.participationType === "TEAM"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        )}
                      >
                        {event.participationType === "SOLO" ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {event.participationType === "SOLO"
                          ? "Solo"
                          : event.participationType === "TEAM"
                          ? "Team"
                          : "Solo/Team"}
                      </span>

                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wider",
                          event.isRegistrationOpen ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {event.isRegistrationOpen ? "Open" : "Closed"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-4 text-xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-200">
                      {event.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-gray-400 line-clamp-3">
                      {event.shortDescription || "No description provided."}
                    </p>
                  </div>

                  {/* Footer info */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500">
                        Registration Fee
                      </span>
                      <span className="font-heading text-lg font-bold text-white">
                        {fee === 0 ? "FREE" : `₹${fee}`}
                      </span>
                    </div>

                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
          >
            <span>View All Events</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
