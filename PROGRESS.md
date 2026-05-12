# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 234
- **Completed**: 228
- **Remaining**: 6
- **Last Updated**: 2026-05-11

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 228: CountryJurisdictionSelector reads from registry [@fullstack]
- **Date**: 2026-05-11
- **Files**:
  - `src/components/CountryJurisdictionSelector.tsx`: Removed `CA_PROVINCES`, `US_STATES`, `AU_STATES_TERRITORIES`, `DEFAULT_JURISDICTION` constants. Added `getRegisteredCountries`, `getCountry`, `CountryCode` imports. Country buttons now rendered via `getRegisteredCountries().map()` using `profile.flagEmoji` and `profile.shortLabel`. Jurisdiction dropdown uses `getCountry(country).jurisdictions`. Country change handler uses `getCountry(newCountry).defaultJurisdiction`.
  - `tests/unit/country-jurisdiction-selector.test.tsx`: Removed constant imports; updated `AU_STATES_TERRITORIES.length`/`CA_PROVINCES.length`/`US_STATES.length` assertions to use `getCountry(code).jurisdictions.length`. Rewrote "jurisdiction data" describe block to use `getCountry()` registry; dropped AU alphabetical sort test (plugin orders by prominence).
  - `src/lib/compute-totals.ts`: Replaced `CA_PROVINCES`/`US_STATES`/`AU_STATES_TERRITORIES` import with `getCountry`. Simplified jurisdiction label lookup to `getCountry(country).jurisdictions.find(...)`.
  - `src/lib/changelog.ts`: Added version 228 entry.
- **Tests**: T1: 4443 passed (186 files), T2: 8 passed (country-jurisdiction.spec.ts), Build: passes
- **Screenshots**: task-228-country-jurisdiction-selector.png
- **Notes**: AU shortLabel in plugin is "Australia" (was hardcoded "AU" in old button). The existing E2E tests use data-testids not button text, so all 8 pass. AU jurisdictions in plugin are ordered by prominence (NSW, VIC, QLD...) not alphabetically — dropped AU alphabetical sort test accordingly.
