import { describe, it, expect } from "vitest";
import { COUNTRIES, getCountry, getRegisteredCountries } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries";

describe("COUNTRIES static registry (task 218)", () => {
  it("contains all three country codes", () => {
    const keys = Object.keys(COUNTRIES) as CountryCode[];
    expect(keys).toContain("CA");
    expect(keys).toContain("US");
    expect(keys).toContain("AU");
    expect(keys).toHaveLength(3);
  });

  it("getCountry returns the correct profile for each code", () => {
    expect(getCountry("CA").code).toBe("CA");
    expect(getCountry("US").code).toBe("US");
    expect(getCountry("AU").code).toBe("AU");
  });

  it("getCountry CA returns Canada", () => {
    expect(getCountry("CA").displayName).toBe("Canada");
  });

  it("getCountry US returns United States", () => {
    expect(getCountry("US").displayName).toBe("United States");
  });

  it("getCountry AU returns Australia", () => {
    expect(getCountry("AU").displayName).toBe("Australia");
  });

  it("getRegisteredCountries returns all three profiles", () => {
    const countries = getRegisteredCountries();
    expect(countries).toHaveLength(3);
    const codes = countries.map((c) => c.code);
    expect(codes).toContain("CA");
    expect(codes).toContain("US");
    expect(codes).toContain("AU");
  });

  it("COUNTRIES entries are the same objects returned by getCountry", () => {
    expect(COUNTRIES.CA).toBe(getCountry("CA"));
    expect(COUNTRIES.US).toBe(getCountry("US"));
    expect(COUNTRIES.AU).toBe(getCountry("AU"));
  });
});
