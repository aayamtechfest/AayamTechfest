export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Hero Area Skeleton */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-16">
            <div className="h-6 w-48 rounded-full shimmer" />
            <div className="h-20 w-3/4 max-w-xl rounded-2xl shimmer" />
            <div className="h-6 w-1/2 max-w-sm rounded-lg shimmer" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-36 rounded-xl shimmer" />
              <div className="h-12 w-36 rounded-xl shimmer border border-white/5" />
            </div>
          </div>

          {/* Highlights Skeleton */}
          <div className="space-y-6">
            <div className="h-8 w-60 rounded-xl shimmer" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-6 w-12 rounded-full shimmer" />
                    <div className="h-4 w-20 rounded-full shimmer" />
                  </div>
                  <div className="h-6 w-3/4 rounded shimmer" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded shimmer" />
                    <div className="h-4 w-5/6 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
