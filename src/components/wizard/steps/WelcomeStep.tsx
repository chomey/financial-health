"use client";

import { getProfilesForCountry, type SampleProfile } from "@/lib/sample-profiles";
import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";

export default function WelcomeStep({
  country,
  jurisdiction,
  taxYear,
  onCountryChange,
  onJurisdictionChange,
  onTaxYearChange,
  loadProfile,
  onProfileLoaded,
  onEnterOwn,
}: {
  country: "CA" | "US";
  jurisdiction: string;
  taxYear: number;
  onCountryChange: (country: "CA" | "US") => void;
  onJurisdictionChange: (jurisdiction: string) => void;
  onTaxYearChange: (year: number) => void;
  loadProfile: (profile: SampleProfile) => void;
  onProfileLoaded: () => void;
  onEnterOwn: () => void;
}) {
  const profiles = getProfilesForCountry(country);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Get Started</h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose your country and region, then pick a sample profile or enter your own numbers.
        </p>
      </div>

      {/* Country / Jurisdiction / Tax Year */}
      <CountryJurisdictionSelector
        country={country}
        jurisdiction={jurisdiction}
        onCountryChange={onCountryChange}
        onJurisdictionChange={onJurisdictionChange}
        taxYear={taxYear}
        onTaxYearChange={onTaxYearChange}
      />

      {/* Sample profiles */}
      <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-emerald-400/5 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Start with a sample profile</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                loadProfile(profile);
                onProfileLoaded();
              }}
              className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-left shadow-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
              data-testid={`sample-profile-${profile.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{profile.emoji}</span>
                <span className="font-semibold text-slate-200 text-sm leading-tight group-hover:text-cyan-400 transition-colors duration-150">{profile.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{profile.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {profile.highlights.map((h) => (
                  <span key={h} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-400/20">{h}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Divider + enter your own */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={onEnterOwn}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-200 hover:border-violet-400/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/10 text-violet-400 text-xl">
            ✏️
          </span>
          <div>
            <span className="font-semibold text-slate-200 text-sm">Enter your own numbers</span>
            <p className="text-xs text-slate-400 mt-0.5">Set up your profile, then add your assets, income, and expenses step by step.</p>
          </div>
        </div>
      </button>
    </div>
  );
}
