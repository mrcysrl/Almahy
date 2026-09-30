export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded bg-gray-200" />
          <div className="h-10 w-36 rounded bg-gray-200" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded border border-gray-200 bg-white p-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-8 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="mb-3 h-6 w-40 rounded bg-gray-200" />
        <div className="h-52 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}