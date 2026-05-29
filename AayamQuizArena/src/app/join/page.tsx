"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinSessionAction } from "@/actions/participant.actions";
import { toast } from "sonner";
import { LogIn, Key, Award, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function JoinLobbyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [registrationCode, setRegistrationCode] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationCode.trim() || !accessCode.trim()) {
      toast.error("Please enter both credentials.");
      return;
    }

    startTransition(async () => {
      const res = await joinSessionAction({
        registrationCode: registrationCode.trim(),
        accessCode: accessCode.trim(),
      });

      if (res.success && res.data) {
        toast.success("Joined lobby successfully!");
        // Store in localStorage for persistence / reconnection
        localStorage.setItem(`session_${res.data.sessionId}_player`, res.data.participantId);
        
        router.push(`/lobby/${res.data.sessionId}?participantId=${res.data.participantId}`);
      } else {
        toast.error(res.error || "Failed to join session.");
      }
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0f23]">
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-600/20 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-purple-600/20 blur-[128px] [animation-delay:2s]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to public site
        </Link>

        {/* Branding */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/40 mb-3 flex items-center justify-center">
            <img src="/Logo.png" alt="AAYAM Logo" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent font-heading">
            AAYAM QUIZ ARENA
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Enter details to join the live game lobby
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration ID */}
            <div className="space-y-1">
              <label htmlFor="regCode" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                AAYAM Registration ID
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="regCode"
                  type="text"
                  required
                  disabled={isPending}
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  placeholder="e.g. cm1a23b45 or REG-1234"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Found on your event registration ticket.
              </p>
            </div>

            {/* Access Code */}
            <div className="space-y-1">
              <label htmlFor="accCode" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Lobby Access Code (6-char)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="accCode"
                  type="text"
                  required
                  maxLength={6}
                  disabled={isPending}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g. A9B8C7"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 uppercase font-mono tracking-widest text-center"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Displayed on the coordinator&apos;s projector screen.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Join Live Lobby</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-500">
          Ensure your registration status is approved to enter live lobbies.
        </p>
      </div>
    </div>
  );
}
