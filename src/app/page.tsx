import { getSettings } from "@/actions/settings.actions";
import { getPublishedEvents } from "@/actions/event.actions";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { EventHighlights } from "@/components/landing/event-highlights";
import { StatsSection } from "@/components/landing/stats-section";
import { CTASection } from "@/components/landing/cta-section";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AAYAM | Annual Technical Festival & Hackathon Arena",
  description: "Welcome to AAYAM, the ultimate annual technical festival. Participate in fast coding challenges, tech quizzes, UI/UX sprints, and 24-hour hackathons. Register now and win cash prizes!",
  keywords: ["AAYAM", "Technical Festival", "Fast Coding", "Hackathon Arena", "Tech Quiz", "UI/UX Design", "University Event"],
};

export default async function Home() {
  const [
    settings,
    publishedEvents,
    registrationCount,
    teamMemberCount,
    registrationColleges,
    teamMemberColleges,
  ] = await Promise.all([
    getSettings().catch(() => null),
    getPublishedEvents().catch(() => []),
    prisma.registration.count().catch(() => 0),
    prisma.teamMember.count().catch(() => 0),
    prisma.registration
      .findMany({ select: { collegeName: true }, distinct: ["collegeName"] })
      .catch(() => []),
    prisma.teamMember
      .findMany({
        where: { NOT: { collegeName: null } },
        select: { collegeName: true },
        distinct: ["collegeName"],
      })
      .catch(() => []),
  ]);

  const totalCompetitors = registrationCount + teamMemberCount;
  const uniqueColleges = new Set([
    ...registrationColleges.map((r) => r.collegeName.trim().toLowerCase()),
    ...teamMemberColleges.map((t) => t.collegeName?.trim().toLowerCase()).filter(Boolean),
  ]);
  const collegeCount = uniqueColleges.size;
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
        <StatsSection
          stats={{
            events: eventCount,
            registrations: registrationCount,
            competitors: totalCompetitors,
            colleges: collegeCount,
          }}
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
