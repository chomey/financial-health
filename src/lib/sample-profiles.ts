import type { FinancialState } from "@/lib/financial-state";
import { getCountry } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries";

export interface SampleProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
  highlights: string[];
  state: FinancialState;
}

/** @deprecated Use getCountry(code).profiles.samples */
export function getProfilesForCountry(country: CountryCode): SampleProfile[] {
  return getCountry(country).profiles.samples;
}

/** @deprecated Use getCountry(code).profiles.quickStarts */
export function getQuickStartProfilesForCountry(country: CountryCode): SampleProfile[] {
  return getCountry(country).profiles.quickStarts;
}
