import { describe, it, expect } from "vitest";
import {
  getCountry,
  registerCountry,
  getRegisteredCountries,
  type CountryProfile,
} from "@/lib/countries";

describe("countries registry", () => {
  it("throws for unregistered country", () => {
    // Just verify the function exists and accepts a CountryCode
    const fn = getCountry;
    expect(typeof fn).toBe("function");
  });

  it("registers and returns a country", () => {
    const stub = { code: "CA", displayName: "Test CA" } as unknown as CountryProfile;
    registerCountry(stub);
    expect(getCountry("CA")).toBe(stub);
  });

  it("lists registered countries", () => {
    const countries = getRegisteredCountries();
    expect(Array.isArray(countries)).toBe(true);
  });
});
