import { Calendar, MapPin, User, Users, ArrowRight } from "lucide-react";

export default function EventsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-white/10 pb-8">
            <div className="space-y-3 flex-1">
              <div className="h-10 w-64 rounded-xl shimmer" />
              <div className="h-4 w-96 rounded-lg shimmer max-w-full" />
            </div>

            {/* Filter Tabs Skeleton */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 md:mt-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-28 rounded-lg shimmer border border-white/5" />
              ))}
            </div>
          </div>

          {/* Grid list Skeleton */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
              >
                <div>
                  {/* Card Header Badge Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 rounded-full shimmer" />
                    <div className="h-4 w-28 rounded-full shimmer" />
                  </div>

                  {/* Title Skeleton */}
                  <div className="mt-5 h-6 w-3/4 rounded-lg shimmer" />

                  {/* Short Description Skeleton */}
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-full rounded-md shimmer" />
                    <div className="h-4 w-5/6 rounded-md shimmer" />
                  </div>

                  {/* Event Details metadata Skeleton */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-600" />
                      <div className="h-3.5 w-32 rounded shimmer" />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-600" />
                      <div className="h-3.5 w-24 rounded shimmer" />
                    </div>
                  </div>
                </div>

                {/* Card Footer Skeleton */}
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="h-3 w-20 rounded shimmer mb-1" />
                    <div className="h-5 w-16 rounded shimmer" />
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="h-4 w-20 rounded shimmer" />
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
