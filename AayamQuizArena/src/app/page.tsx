import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Trophy, Zap, Users, BarChart3, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />

      {/* Hero Section */}
      <main className="flex-1 pt-24 md:pt-32 relative overflow-hidden">
        {/* Glowing background radial blur */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute -right-20 top-40 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>

        {/* Hero Content */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 font-medium">
            <Trophy className="h-4 w-4" />
            University Live Competition Portal
          </div>

          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent font-heading leading-tight max-w-4xl mx-auto">
            Welcome to the <br />
            <span className="gradient-text">AAYAM Quiz Arena</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 leading-relaxed">
            Participate in real-time solo or team quiz battles. Watch live questions, trigger fast buzzers, and check your rank on the live screen instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/join"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-[1.02]"
            >
              Enter Game Lobby
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Coordinator Portal
            </Link>
          </div>
        </section>

        {/* Features list */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
          <h2 className="text-center font-heading text-2xl font-bold text-white mb-12">
            Engineered for Real-Time Event Hosting
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Instant Buzzers
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Server-side millisecond timestamp queue guarantees fair buzz orders for rapid-fire rounds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Live Leaderboard
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Watch point tallies update live on the central projector as players submit choices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Team Aggregates
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Supports team dynamics. Members score points which accumulate automatically for their team.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Verified Identity
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Contestants authenticate using their unique AAYAM Event Registration ID for security.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
