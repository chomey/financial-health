export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-stone-900">
          Financial Health Snapshot
        </h1>
        <p className="text-sm text-stone-500">
          Your finances at a glance — no judgment, just clarity
        </p>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg text-stone-600">
            Welcome! Your financial snapshot is on its way.
          </p>
        </div>
      </main>
    </div>
  );
}
