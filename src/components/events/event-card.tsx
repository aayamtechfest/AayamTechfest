import Link from "next/link";
import { ArrowRight, Users, User, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    participationType: "SOLO" | "TEAM" | "BOTH";
    registrationFee: any;
    isRegistrationOpen: boolean;
    venue?: string | null;
    eventDate?: Date | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const fee = event.registrationFee ? Number(event.registrationFee) : 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:bg-white/10 animate-fade-in">
      <div>
        {/* Card Header Badge */}
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
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
              event.isRegistrationOpen ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {event.isRegistrationOpen ? "Registration Open" : "Registration Closed"}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-200">
          {event.name}
        </h3>

        {/* Short Description */}
        <p className="mt-2 text-sm text-gray-400 line-clamp-3">
          {event.shortDescription || "Get ready to showcase your abilities."}
        </p>

        {/* Event Details metadata */}
        <div className="mt-4 space-y-2">
          {event.eventDate && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>{new Date(event.eventDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="h-3.5 w-3.5 text-indigo-400" />
              <span>{event.venue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
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
}
