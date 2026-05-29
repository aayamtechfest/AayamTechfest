export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-8">
      {/* Premium glowing spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
