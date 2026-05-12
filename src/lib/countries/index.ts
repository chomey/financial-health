import { CANADA } from "./canada";
import { USA } from "./usa";
import { AUSTRALIA } from "./australia";
import type { CountryCode, CountryProfile } from "./types";

export const COUNTRIES: Record<CountryCode, CountryProfile> = {
  CA: CANADA,
  US: USA,
  AU: AUSTRALIA,
};

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
} from "./types";
