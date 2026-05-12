import { CANADA } from "./canada";
import { USA } from "./usa";
import { AUSTRALIA } from "./australia";
import type { CountryCode, CountryProfile } from "./types";

// Using property getters keeps the registry tolerant of module-load order:
// when a country plugin transitively imports `getCountry` (via withdrawal-tax,
// flowchart-steps, etc.) before its own `export const` has been assigned, a
// frozen object literal would snapshot `undefined`. Getters re-read the live
// binding on each access, so the lookup always sees the fully-loaded value.
export const COUNTRIES: Record<CountryCode, CountryProfile> = {
  get CA() { return CANADA; },
  get US() { return USA; },
  get AU() { return AUSTRALIA; },
} as Record<CountryCode, CountryProfile>;

export function getCountry(code: CountryCode): CountryProfile {
  return COUNTRIES[code];
}

export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRIES);
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
  FlowchartWiki,
  Locale,
  WithdrawalTaxArgs,
  TaxBracketSegment,
  BracketSegmentArgs,
  BracketSegmentResult,
  RmdRule,
  AgeGroupBenchmark,
  NationalAverage,
  BenchmarkData,
  RawFlowchartStep,
  FlowchartStepsBuilder,
} from "./types";
