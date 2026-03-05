import Link from "next/link";
import { getChangelogByMilestone } from "@/lib/changelog";

export const metadata = {
  title: "Changelog — Financial Health Snapshot",
  description: "Version history and feature updates for Financial Health Snapshot.",
};

export default function ChangelogPage() {
  const milestones = getChangelogByMilestone();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
              Changelog
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Version history and feature updates
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition-all duration-200 hover:bg-stone-200 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Back to App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {milestones.map(({ milestone, entries }) => (
          <section key={milestone} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2">
              {milestone}
            </h2>
            <div className="space-y-3">
              {entries.map((entry) => (
                <article
                  key={entry.version}
                  className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          v{entry.version}
                        </span>
                        <h3 className="text-sm font-medium text-stone-900 sm:text-base">
                          {entry.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">
                        {entry.description}
                      </p>
                    </div>
                    <time
                      dateTime={entry.date}
                      className="shrink-0 text-xs text-stone-400"
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
