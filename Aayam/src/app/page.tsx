import { getSettings } from "@/actions/settings.actions";
import { getPublishedEvents } from "@/actions/event.actions";
import { getEventsWithWinners } from "@/actions/winner.actions";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { EventHighlights } from "@/components/landing/event-highlights";
import { WinnersPodium } from "@/components/landing/winners-podium";
import { StatsSection } from "@/components/landing/stats-section";
import { CTASection } from "@/components/landing/cta-section";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AAYAM 2026 | RKDF University Ranchi TechFest",
  description: "AAYAM is the official annual technical festival of RKDF University Ranchi featuring hackathons, fast coding competitions, UI/UX design sprints, technical quizzes, workshops, and innovation challenges. Register now to participate and win exciting cash prizes!",
  keywords: ["AAYAM", "Aayam", "Aayam TechFest", "RKDF University Ranchi", "Aayam RKDF TechFest", "aayam techfest rkdf", "Technical Festival", "Fast Coding", "Hackathon Arena", "Tech Quiz", "UI/UX Design", "University Event"],
};

export default async function Home() {
  const [
    settings,
    publishedEvents,
    registrationCount,
    teamMemberCount,
    submissionCount,
    eventsWithWinners,
  ] = await Promise.all([
    getSettings().catch(() => null),
    getPublishedEvents().catch(() => []),
    prisma.registration.count().catch(() => 0),
    prisma.teamMember.count().catch(() => 0),
    prisma.submission.count().catch(() => 0),
    getEventsWithWinners().catch(() => []),
  ]);

  const totalCompetitors = registrationCount + teamMemberCount;
  const eventCount = publishedEvents.length;

  const heroSettings = settings
    ? {
        tagline: settings.tagline,
        eventTitle: settings.eventTitle,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />
      <main className="flex-grow">
        <HeroSection
          settings={heroSettings}
          eventDate={settings?.countdownDate}
        />
        <EventHighlights events={publishedEvents} />
        {eventsWithWinners && eventsWithWinners.length > 0 && (
          <WinnersPodium events={eventsWithWinners} />
        )}
        <StatsSection
          stats={{
            events: eventCount,
            registrations: registrationCount,
            competitors: totalCompetitors,
            submissions: submissionCount,
          }}
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
