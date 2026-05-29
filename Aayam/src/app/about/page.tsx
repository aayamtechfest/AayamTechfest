export const dynamic = "force-dynamic";

import { getSettings } from "@/actions/settings.actions";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sparkles, Target, Compass, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About AAYAM | Our Vision, Mission & Core Values",
  description: "Learn about the mission, vision, and pillars behind AAYAM - the premier university-level event and hackathon arena designed to bridge the gap between academia and industry standards.",
  keywords: ["About AAYAM", "Fest vision", "Mission statement", "AAYAM values", "Technical festival pillars"],
};

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          
          {/* Hero Section */}
          <div className="text-center mb-16 animate-slide-down">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>About the Fest</span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              About{" "}
              <span className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                AAYAM
              </span>
            </h1>
            <p className="mt-4 text-base text-gray-400 max-w-xl mx-auto">
              Learn about the vision, goals, and core values of our annual university technical festival.
            </p>
          </div>

          {/* Dynamic Content from Settings */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl mb-12 animate-slide-up [animation-delay:150ms] transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
            <h2 className="font-heading text-2xl font-bold text-white mb-6 border-b border-white/5 pb-3">
              Official Description
            </h2>
            {settings?.aboutContent ? (
              <div
                className="prose prose-invert text-gray-300 leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: settings.aboutContent }}
              />
            ) : (
              <p className="text-gray-400 italic leading-relaxed">
                AAYAM is the official annual tech festival of our university, uniting thousands of tech enthusiasts, developers, and designers to showcase their skills, solve real-world challenges, and share revolutionary ideas. Across key competition categories (fast coding, quiz, UI/UX, and hackathon), we foster innovation, teamwork, and technical excellence.
              </p>
            )}
          </div>

          {/* Pillars: Mission, Vision, Values */}
          <div className="grid gap-6 md:grid-cols-3 animate-slide-up [animation-delay:300ms]">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:bg-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-300 group-hover:text-indigo-300">Our Mission</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                To provide a platform that enables students to learn, build, and deploy technical solutions while competing with standard industry parameters.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:bg-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-300 group-hover:text-indigo-300">Our Vision</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                To bridge the gap between academic theory and practical software engineering, preparing developers for future technology challenges.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:bg-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-300 group-hover:text-indigo-300">Core Value</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                We believe in open competition, fair evaluation, active learning, and pushing the boundaries of coding and interface design.
              </p>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
