export const dynamic = "force-dynamic";

import { getEventBySlug } from "@/actions/event.actions";
import { getSettings } from "@/actions/settings.actions";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { formatDateTime, formatDate, serializePrisma } from "@/lib/utils";
import { ReleaseCountdown } from "@/components/events/release-countdown";
import { ProjectSubmissionForm } from "@/components/events/project-submission-form";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const event = await getEventBySlug(resolvedParams.slug);

  if (!event) {
    return {
      title: "Event Not Found | AAYAM",
    };
  }

  return {
    title: `${event.name} | AAYAM`,
    description: event.shortDescription || `Join ${event.name} at AAYAM annual fest.`,
  };
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const dbEvent = await getEventBySlug(resolvedParams.slug);
  const dbSettings = await getSettings();

  if (!dbEvent) {
    notFound();
  }

  const event = serializePrisma(dbEvent);
  const settings = serializePrisma(dbSettings);

  const activeTab = resolvedSearchParams.tab || "overview";
  const fee = event.registrationFee ? Number(event.registrationFee) : 0;
  
  // Check if problem statement should be revealed
  const now = new Date();
  const isProblemReleased =
    event.problemReleaseTime && now >= new Date(event.problemReleaseTime);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "rules", label: "Rules & Guidelines" },
    { id: "prizes", label: "Prizes" },
    { id: "schedule", label: "Schedule" },
  ];

  if (event.isSubmissionOpen) {
    tabs.push({ id: "submission", label: "Project Submission" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to all competitions</span>
          </Link>

          {/* Banner / Title Area */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl mb-8 animate-slide-down min-h-[220px] flex items-end">
            {event.bannerUrl ? (
              <>
                <img
                  src={event.bannerUrl}
                  alt={`${event.name} Banner`}
                  className="absolute inset-0 h-full w-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-black/20 to-black/40" />
              </>
            ) : (
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
            )}
            <div className="relative z-10 w-full">
              <h1 className="font-heading text-3xl font-extrabold text-white sm:text-5xl">
                {event.name}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-gray-300">
                {event.shortDescription || "Details will be declared soon."}
              </p>
            </div>
          </div>

          {/* Winners Banner */}
          {(event.winner1 || event.winner2 || event.winner3) && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-md shadow-xl mb-8 animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Winners Announced!</h3>
                  <p className="text-sm text-gray-400">Congratulations to the top performers of this competition.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
                {event.winner1 && (
                  <div className="flex items-center gap-2 rounded-xl bg-yellow-500/25 border border-yellow-500/35 px-4 py-2 text-xs font-semibold text-yellow-300">
                    🥇 1st: {event.winner1.teamName ? `Team ${event.winner1.teamName}` : event.winner1.participantName}
                  </div>
                )}
                {event.winner2 && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-400/20 border border-slate-400/35 px-4 py-2 text-xs font-semibold text-slate-300">
                    🥈 2nd: {event.winner2.teamName ? `Team ${event.winner2.teamName}` : event.winner2.participantName}
                  </div>
                )}
                {event.winner3 && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-700/25 border border-amber-700/35 px-4 py-2 text-xs font-semibold text-amber-400">
                    🥉 3rd: {event.winner3.teamName ? `Team ${event.winner3.teamName}` : event.winner3.participantName}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3 animate-slide-up [animation-delay:150ms]">
            {/* Main Tabs Area */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/10 gap-4 overflow-x-auto pb-px no-scrollbar max-w-full">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={`/events/${event.slug}?tab=${tab.id}`}
                    scroll={false}
                    className={`border-b-2 py-3 px-1 text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl text-gray-300 break-words">
                {activeTab === "submission" && event.isSubmissionOpen && (
                  <ProjectSubmissionForm eventId={event.id} />
                )}

                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">Event Description</h3>
                    <div className="whitespace-pre-line leading-relaxed">
                      {event.description || "Description will be declared soon."}
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="font-heading text-lg font-semibold text-white mb-2">Eligibility Criteria</h4>
                      <p className="whitespace-pre-line">
                        {event.eligibility || "Eligibility criteria will be declared soon."}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "rules" && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">Rules & Guidelines</h3>
                    {event.rules ? (
                      <div className="whitespace-pre-line leading-relaxed">{event.rules}</div>
                    ) : (
                      <p className="text-gray-400 italic">Rules will be declared soon.</p>
                    )}
                  </div>
                )}

                {activeTab === "prizes" && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">Prize Details</h3>
                    {event.prizeDetails ? (
                      <div className="whitespace-pre-line leading-relaxed">{event.prizeDetails}</div>
                    ) : (
                      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-400">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 flex-shrink-0" />
                          <span>Prize details will be declared soon.</span>
                        </div>
                        <span className="text-xs text-gray-400">Exciting rewards and certificates will be awarded to all top performers!</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "schedule" && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">Event Schedule</h3>
                    {event.schedule ? (
                      <div className="whitespace-pre-line leading-relaxed">{event.schedule}</div>
                    ) : (
                      <p className="text-gray-400 italic">Schedule will be declared soon.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Problem Statement Card (Time-locked) */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="font-heading text-xl font-bold text-white">Challenge Statement</h3>
                  {event.problemStatement && (isProblemReleased || !event.problemReleaseTime) ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      <Unlock className="h-4 w-4" /> Released
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                      <Lock className="h-4 w-4" /> Locked
                    </span>
                  )}
                </div>

                {event.problemReleaseTime && !isProblemReleased ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 animate-slide-up">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 animate-bounce" style={{ animationDuration: '3s' }}>
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">Challenge is Locked</h4>
                      <p className="mt-2 text-sm text-gray-400 max-w-md">
                        The problem statement for this event will be released in:
                      </p>
                      <div className="my-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 shadow-lg shadow-indigo-500/10 transition-all duration-300 hover:shadow-indigo-500/20">
                        <ReleaseCountdown releaseTime={event.problemReleaseTime.toString()} />
                      </div>
                      <p className="text-xs text-gray-500">
                        Scheduled Release: <span className="text-indigo-300 font-semibold">{formatDateTime(event.problemReleaseTime)}</span>
                      </p>
                    </div>
                  </div>
                ) : event.problemStatement && (isProblemReleased || !event.problemReleaseTime) ? (
                  <div className="space-y-4 text-gray-300 animate-fade-in">
                    {event.problemSummary && (
                      <div>
                        <h4 className="font-semibold text-white">Summary:</h4>
                        <p className="mt-1">{event.problemSummary}</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="font-semibold text-white">Detailed Problem Statement:</h4>
                      <div className="mt-2 rounded-xl bg-black/30 p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap transition-all duration-300 border border-white/5 hover:border-indigo-500/30">
                        {event.problemStatement}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 animate-fade-in">
                    <Lock className="h-10 w-10 text-indigo-400 mb-4 animate-pulse" />
                    <div>
                      <h4 className="text-white font-semibold text-lg">Challenge Statement Not Available</h4>
                      <p className="mt-2 text-sm max-w-sm text-gray-400">
                        The challenge details will be made available during the event.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Details Area */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-6 transition-all duration-300 hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/5">
                <h3 className="font-heading text-lg font-bold text-white border-b border-white/5 pb-3">
                  Competition Details
                </h3>

                <div className="space-y-4">
                  {/* Fee */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Registration Fee</span>
                    <span className="font-heading text-xl font-bold text-white">
                      {fee === 0 ? "FREE" : `₹${fee}`}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-indigo-400 mt-0.5" />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">Event Date</span>
                      <span className="text-sm text-gray-300 font-medium">
                        {event.eventDate ? formatDate(event.eventDate) : "Will be declared soon"}
                      </span>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-indigo-400 mt-0.5" />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">Deadline</span>
                      <span className="text-sm text-gray-300 font-medium">
                        {event.lastRegistrationDate ? formatDateTime(event.lastRegistrationDate) : "Will be declared soon"}
                      </span>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-indigo-400 mt-0.5" />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">Venue</span>
                      <span className="text-sm text-gray-300 font-medium">
                        {event.venue || "Will be declared soon"}
                      </span>
                    </div>
                  </div>

                  {/* Team Size */}
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-indigo-400 mt-0.5" />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">Team Size</span>
                      <span className="text-sm text-gray-300 font-medium">
                        {event.participationType === "SOLO"
                          ? "Individual (1 Member)"
                          : `${event.minTeamSize} to ${event.maxTeamSize} Members`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Register CTA Button */}
                {event.isRegistrationOpen ? (
                  <Link
                    href={`/register/${event.slug}`}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-indigo-500/30"
                  >
                    Register for Competition
                  </Link>
                ) : (
                  <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-400 cursor-not-allowed">
                    <AlertCircle className="h-4 w-4" />
                    <span>Registrations Closed</span>
                  </div>
                )}
              </div>

              {/* Payment Instructions if applicable */}
              {fee > 0 && settings?.paymentInstructions && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-3">
                  <h4 className="font-semibold text-white">Payment Instructions</h4>
                  <div className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">
                    {settings.paymentInstructions}
                  </div>
                  {settings.paymentQrCodeUrl && (
                    <div className="mt-4 flex justify-center">
                      <img
                        src={settings.paymentQrCodeUrl}
                        alt="Payment QR Code"
                        className="rounded-xl border border-white/10 bg-white p-2 h-64 w-64 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
