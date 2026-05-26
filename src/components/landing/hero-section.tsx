"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Lock } from "lucide-react";

interface HeroSectionProps {
  settings: {
    tagline?: string | null;
    eventTitle?: string | null;
  } | null;
  eventDate?: Date | string | null;
}

export function HeroSection({ settings, eventDate }: HeroSectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!eventDate) return;
    const target = new Date(eventDate).getTime();
    if (isNaN(target)) return;

    const tick = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsExpired(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0f23] pt-20">
      {/* Slow spinning grid background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0f0f23_80%)] z-1" />
      <div
        className="pointer-events-none absolute -inset-[50%] opacity-15 animate-spin-slow z-1"
        style={{
          backgroundImage: "radial-gradient(rgba(79, 70, 229, 0.2) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          animationDuration: "160s"
        }}
      />

      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 z-1">
        <div className="absolute -left-20 top-20 h-[600px] w-[600px] animate-pulse rounded-full bg-indigo-600/10 blur-[150px] transition-all duration-1000" />
        <div className="absolute -right-20 bottom-20 h-[600px] w-[600px] animate-pulse rounded-full bg-purple-600/10 blur-[150px] [animation-delay:3s]" />
      </div>

      {/* Floating geometric elements */}
      <div className="pointer-events-none absolute inset-0 opacity-30 z-1">
        <div className="absolute top-1/4 left-1/12 h-8 w-8 rounded-lg border border-indigo-400 rotate-12 animate-float" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-1/4 right-1/12 h-12 w-12 rounded-full border border-purple-400 animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 h-6 w-6 rotate-45 border-t-2 border-l-2 border-indigo-300 animate-pulse" />
      </div>

      {/* Floating blur particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-1">
        <div className="absolute top-10 left-10 h-4 w-4 rounded-full bg-indigo-500/30 blur-[2px] animate-float" style={{ animationDuration: "8s", animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-1/4 h-3 w-3 rounded-full bg-purple-500/40 blur-[1px] animate-float" style={{ animationDuration: "10s", animationDelay: "3s" }} />
        <div className="absolute bottom-1/3 right-1/3 h-5 w-5 rounded-full bg-amber-500/20 blur-[3px] animate-float" style={{ animationDuration: "12s", animationDelay: "0s" }} />
        <div className="absolute bottom-12 right-12 h-3 w-3 rounded-full bg-indigo-400/30 blur-[1px] animate-float" style={{ animationDuration: "7s", animationDelay: "5s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* AAYAM Event Title Tag */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 animate-slide-down">
          <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
          <span>{settings?.eventTitle || "AAYAM 2026"} • Annual Technical Festival</span>
        </div>

        {/* Huge Gradient Title */}
        <h1 className="font-heading text-6xl font-extrabold tracking-tight text-white sm:text-7xl md:text-9xl animate-fade-in">
          <span className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-500 bg-clip-text text-transparent inline-block hover:scale-[1.02] transition-transform duration-500 cursor-default">
            AAYAM
          </span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-300 sm:text-2xl animate-slide-up [animation-delay:150ms]">
          {settings?.tagline || "Innovate. Compete. Excel."}
        </p>

        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-400 sm:text-base animate-slide-up [animation-delay:250ms]">
          Join the ultimate arena of coding, design, and problem solving. Unleash your full potential and win exciting prizes.
        </p>

        {/* Countdown Timer or Expired Banner */}
        {eventDate && (
          <div className="mx-auto mt-12 max-w-3xl animate-slide-up [animation-delay:350ms]">
            {isExpired ? (
              /* ─── Registrations Closed Banner ─────────────────────── */
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-8 py-6 text-center backdrop-blur-md">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Lock className="h-5 w-5 text-rose-400" />
                  <p className="text-rose-300 font-bold text-lg tracking-wide uppercase">
                    Registrations are Closed
                  </p>
                </div>
                <p className="text-rose-400/70 text-sm">
                  The registration deadline for this event has passed. Thank you to all participants who have registered!
                </p>
              </div>
            ) : (
              /* ─── Live Countdown ───────────────────────────────────── */
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Event Countdown</p>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-6">
                  {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hours", value: timeLeft.hours },
                    { label: "Minutes", value: timeLeft.minutes },
                    { label: "Seconds", value: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30 hover:shadow-indigo-500/10 hover:bg-white/10"
                    >
                      <span className="font-heading text-3xl font-bold text-white sm:text-5xl">
                        {String(item.value).padStart(2, "0")}
                      </span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:text-xs">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up [animation-delay:450ms]">
          <Link
            href="/events"
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 hover:brightness-110 sm:w-auto"
          >
            <span>Explore Events</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {isExpired ? (
            <div className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-8 text-base font-semibold text-rose-400 cursor-not-allowed sm:w-auto">
              <Lock className="h-4 w-4" />
              Registrations Closed
            </div>
          ) : (
            <Link
              href="/events"
              className="flex h-14 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] sm:w-auto"
            >
              Register Now
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
