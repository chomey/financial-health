import type { CountryCode, CountryProfile } from "./types";

const COUNTRIES_INTERNAL: Partial<Record<CountryCode, CountryProfile>> = {};

/**
 * Register a country profile in the central registry.
 * Called by each country's index module at top-level (no side-effects beyond registration).
 */
export function registerCountry(profile: CountryProfile): void {
  COUNTRIES_INTERNAL[profile.code] = profile;
}

export function getCountry(code: CountryCode): CountryProfile {
  const profile = COUNTRIES_INTERNAL[code];
  if (!profile) {
    throw new Error(`Country profile not registered: ${code}`);
  }
  return profile;
}

export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRIES_INTERNAL).filter((p): p is CountryProfile => p !== undefined);
}

export type {
  CountryCode,
  CountryProfile,
  Jurisdiction,
  TaxEngine,
  VehicleCatalog,
  GovernmentRetirementPlugin,
  TaxCreditCatalog,
  ProfileLibrary,
  InsightProvider,
  Locale,
  WithdrawalTaxArgs,
} from "./types";
