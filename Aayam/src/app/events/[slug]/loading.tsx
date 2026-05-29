import { Calendar, MapPin, Users, Trophy, Lock, Clock, ArrowLeft } from "lucide-react";

export default function EventDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link placeholder */}
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 mb-8">
            <ArrowLeft className="h-4 w-4" />
            <div className="h-4 w-36 rounded shimmer" />
          </div>

          {/* Banner Skeleton */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl mb-8">
            <div className="space-y-4">
              <div className="h-10 w-2/3 rounded-2xl shimmer max-w-lg" />
              <div className="h-5 w-1/2 rounded-lg shimmer max-w-md" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Tabs Area Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation Skeleton */}
              <div className="flex border-b border-white/10 gap-6 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 w-20 rounded shimmer" />
                ))}
              </div>

              {/* Tab Content Card Skeleton */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-6">
                <div className="h-6 w-40 rounded-lg shimmer" />
                <div className="space-y-3">
                  <div className="h-4 w-full rounded-md shimmer" />
                  <div className="h-4 w-full rounded-md shimmer" />
                  <div className="h-4 w-3/4 rounded-md shimmer" />
                </div>

                <div className="border-t border-white/5 pt-6 space-y-3">
                  <div className="h-5 w-36 rounded-lg shimmer" />
                  <div className="h-4 w-full rounded-md shimmer" />
                  <div className="h-4 w-5/6 rounded-md shimmer" />
                </div>
              </div>

              {/* Challenge Statement Card Skeleton */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="h-6 w-44 rounded-lg shimmer" />
                  <div className="h-5 w-16 rounded-full shimmer" />
                </div>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <Lock className="h-10 w-10 text-gray-600 animate-pulse" />
                  <div className="h-5 w-40 rounded shimmer" />
                  <div className="h-4 w-60 rounded shimmer" />
                </div>
              </div>
            </div>

            {/* Sidebar Details Area Skeleton */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-6">
                <div className="h-6 w-36 rounded-lg shimmer border-b border-white/5 pb-2" />

                <div className="space-y-5">
                  {[
                    { icon: Calendar, labelWidth: "w-20", valWidth: "w-28" },
                    { icon: Clock, labelWidth: "w-16", valWidth: "w-36" },
                    { icon: MapPin, labelWidth: "w-12", valWidth: "w-24" },
                    { icon: Users, labelWidth: "w-16", valWidth: "w-32" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <item.icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <div className={`h-3 ${item.labelWidth} rounded shimmer`} />
                        <div className={`h-4 ${item.valWidth} rounded shimmer`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Button Skeleton */}
                <div className="h-12 w-full rounded-xl shimmer mt-6" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
