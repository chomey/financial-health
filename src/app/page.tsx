"use client";

import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";

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
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            className="lg:col-span-5"
            aria-label="Financial dashboard"
          >
            <div className="space-y-6 lg:sticky lg:top-8">
              <DashboardCard title="Net Worth" value="—">
                <p className="text-xs text-stone-400">
                  Assets minus debts
                </p>
              </DashboardCard>

              <DashboardCard title="Monthly Surplus" value="—">
                <p className="text-xs text-stone-400">
                  Income minus expenses
                </p>
              </DashboardCard>

              <DashboardCard title="Financial Runway" value="—">
                <p className="text-xs text-stone-400">
                  Months of expenses covered by liquid assets
                </p>
              </DashboardCard>

              <DashboardCard title="Debt-to-Asset Ratio" value="—">
                <p className="text-xs text-stone-400">
                  How your debts compare to your assets
                </p>
              </DashboardCard>
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

function DashboardCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <h3 className="text-sm font-medium text-stone-500">{title}</h3>
      <p className="mt-1 text-3xl font-bold text-stone-800">{value}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
