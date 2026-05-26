import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative bg-[#0f0f23] py-24 overflow-hidden border-t border-white/5">
      {/* Background radial gradient */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950/60 p-8 text-center backdrop-blur-md shadow-2xl sm:p-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-6">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>

          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to Take the Challenge?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300">
            Secure your spot in the most anticipated technical festival of the year. Push your boundaries, showcase your expertise, and connect with fellow creators.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/events"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/35"
            >
              <span>Explore & Register</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
