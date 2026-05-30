"use client";

import Link from "next/link";
import { Gamepad2, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0f0f23] text-[#e2e8f0] px-4 overflow-hidden selection:bg-indigo-500/30">
      {/* Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-indigo-600/10 blur-3xl animate-float pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-purple-600/10 blur-3xl animate-float pointer-events-none select-none" style={{ animationDelay: "-3s" }} />

      {/* Orbit lines for cool quiz/tech theme */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[600px] h-[600px] rounded-full border border-white/5 animate-spin-slow" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-white/5 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "12s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 md:p-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center space-y-6 animate-fade-in">
        {/* Animated Icon Header */}
        <div className="flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 animate-float">
            <Gamepad2 className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        {/* Huge 404 Text */}
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-black tracking-widest font-heading gradient-text select-none animate-pulse-glow">
            404
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-white font-heading tracking-wide">
            Arena Offline
          </h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-400 leading-relaxed">
          The quiz lobby, session, or route you are looking for does not exist. If you are trying to join a live quiz, make sure your access code is correct.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Gamepad2 className="h-4 w-4" />
            Join Live Lobby
          </Link>
          
          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShieldAlert className="h-4 w-4 text-indigo-400" />
            Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-xs text-gray-500 font-mono tracking-wider animate-slide-up">
        AAYAM QUIZ ARENA
      </div>
    </div>
  );
}
