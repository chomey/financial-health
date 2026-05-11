import { describe, it, expect } from "vitest";
import {
  getCountry,
  getRegisteredCountries,
} from "@/lib/countries";

describe("countries registry", () => {
  it("getCountry is a function", () => {
    expect(typeof getCountry).toBe("function");
  });

  it("getCountry returns CA", () => {
    expect(getCountry("CA").code).toBe("CA");
  });

  it("lists registered countries", () => {
    const countries = getRegisteredCountries();
    expect(Array.isArray(countries)).toBe(true);
  });
});
