"use client";

import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";
import SnapshotDashboard from "@/components/SnapshotDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-stone-900">
            Financial Health Snapshot
          </h1>
          <p className="text-sm text-stone-500">
            Your finances at a glance — no judgment, just clarity
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7"
            aria-label="Financial data entry"
          >
            <div className="space-y-6">
              <AssetEntry />

              <DebtEntry />

              <IncomeEntry />

              <ExpenseEntry />

              <GoalEntry />
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            className="lg:col-span-5"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8">
              <SnapshotDashboard />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function EntryCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className="text-sm">{children}</div>
    </div>
  );
}

