import Link from "next/link";
import { getChangelogByMilestone } from "@/lib/changelog";

export const metadata = {
  title: "Changelog — Financial Health Snapshot",
  description: "Version history and feature updates for Financial Health Snapshot.",
};

export default function ChangelogPage() {
  const milestones = getChangelogByMilestone();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <header className="border-b border-white/10 bg-[var(--surface-2)] px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
              Changelog
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Version history and feature updates
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/10 bg-[var(--surface-1)] px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Back to App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {milestones.map(({ milestone, entries }) => (
          <section key={milestone} className="mb-8">
            <h2 className="mb-4 border-b border-white/10 pb-2 text-lg font-semibold text-slate-200">
              {milestone}
            </h2>
            <div className="space-y-3">
              {entries.map((entry) => (
                <article
                  key={entry.version}
                  className="rounded-2xl border border-white/10 bg-[var(--surface-2)] p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                          v{entry.version}
                        </span>
                        <h3 className="text-sm font-medium text-slate-100 sm:text-base">
                          {entry.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {entry.description}
                      </p>
                    </div>
                    <time
                      dateTime={entry.date}
                      className="shrink-0 text-xs text-slate-400"
                    >
                      {entry.date}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
