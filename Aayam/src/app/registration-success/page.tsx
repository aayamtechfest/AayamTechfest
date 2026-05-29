import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { CheckCircle, ArrowRight, Mail, Calendar, HelpCircle } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function RegistrationSuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const registrationId = resolvedSearchParams.id || "REG-UNKNOWN";

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23] overflow-hidden relative">
      {/* Background confetti effects (CSS-based animated circles) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[20%] left-[10%] h-2 w-2 rounded-full bg-indigo-400 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[40%] right-[15%] h-3 w-3 rounded-full bg-purple-500 animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[30%] left-[20%] h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-[20%] right-[30%] h-2 w-2 rounded-full bg-amber-400 animate-ping" style={{ animationDuration: '2.5s' }} />
      </div>

      <Header />
      <main className="flex-grow pt-28 pb-16 flex items-center justify-center relative z-10">
        <div className="mx-auto max-w-xl px-4 w-full">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/5 p-8 text-center backdrop-blur-md shadow-2xl sm:p-12">
            {/* Animated Check */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-white">
              Registration Submitted!
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              Thank you for registering. Your details and payment proof have been successfully received and are under review.
            </p>

            {/* Registration ID Banner */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Your Registration ID
              </span>
              <span className="mt-1 block font-mono text-2xl font-bold text-indigo-400 uppercase tracking-wider select-all">
                {registrationId}
              </span>
              <span className="mt-2 block text-[10px] text-gray-400">
                Keep this ID handy for future communication and updates.
              </span>
            </div>

            {/* Next Steps */}
            <div className="mt-8 text-left space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 border-b border-white/5 pb-2">
                What happens next?
              </h3>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Verification Email
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Our team will verify your transaction details. You will receive an automated confirmation email once your payment is approved.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Check the Dashboard
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Challenge statements and event schedule details will be unlocked under each competition page leading up to the fest.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5" /> Need Assistance?
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">
                    If you have queries or entered incorrect details, please reach out to us at support using your Registration ID.
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-10 pt-6 border-t border-white/5 flex flex-col gap-4">
              <Link
                href="/events"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01]"
              >
                <span>Browse Other Events</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
