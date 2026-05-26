export const dynamic = "force-dynamic";

import { getPublishedEvents } from "@/actions/event.actions";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EventCard } from "@/components/events/event-card";
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tech Events & Hackathons List | AAYAM Competitions",
  description: "Browse our dynamic schedule of competitive arenas including fast coding challenges, tech quizzes, UI/UX sprints, and 24-hour hackathons. Register solo or in teams!",
  keywords: ["AAYAM Events", "Coding Challenges", "Tech Hackathon", "Design Competition", "Registration"],
};

interface PageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filterType = resolvedSearchParams.type || "ALL";

  const allEvents = await getPublishedEvents();

  const filteredEvents = allEvents.filter((event) => {
    if (filterType === "ALL") return true;
    return event.participationType === filterType;
  });

  const filterOptions = [
    { label: "All Events", value: "ALL" },
    { label: "Solo Only", value: "SOLO" },
    { label: "Team Only", value: "TEAM" },
    { label: "Solo & Team", value: "BOTH" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-white/10 pb-8">
            <div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                <span className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  All Competitions
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-400">
                Explore our lineup of exciting tech challenges, pick your arena, and show what you've got.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 md:mt-0">
              {filterOptions.map((opt) => (
                <Link
                  key={opt.value}
                  href={opt.value === "ALL" ? "/events" : `/events?type=${opt.value}`}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                    filterType === opt.value
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Grid list */}
          {filteredEvents.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/5 p-16 text-center backdrop-blur-md">
              <Trophy className="h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-bold text-white">No Competitions Found</h3>
              <p className="mt-2 text-sm text-gray-400 max-w-sm">
                We couldn't find any events matching your filter. Try choosing another category.
              </p>
              <Link
                href="/events"
                className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
