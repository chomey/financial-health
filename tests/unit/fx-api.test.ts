import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/fx-rate/route";
import { NextRequest } from "next/server";

function makeRequest(from?: string, to?: string): NextRequest {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return new NextRequest(`http://localhost:3000/api/fx-rate?${params.toString()}`);
}

describe("FX rate API route", () => {
  it("returns 400 for missing from param", async () => {
    const res = await GET(makeRequest(undefined, "USD"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid currency");
  });

  it("returns 400 for missing to param", async () => {
    const res = await GET(makeRequest("CAD"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for unsupported currency", async () => {
    const res = await GET(makeRequest("EUR", "USD"));
    expect(res.status).toBe(400);
  });

  it("returns rate 1 for same currency", async () => {
    const res = await GET(makeRequest("USD", "USD"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rate).toBe(1);
    expect(data.source).toBe("identity");
  });

  it("accepts valid currency pair (may hit live API)", async () => {
    const res = await GET(makeRequest("CAD", "USD"));
    // Could be 200 or 502 depending on network
    expect(res.status).not.toBe(400);
  });

  it("accepts lowercase currency codes", async () => {
    const res = await GET(makeRequest("cad", "usd"));
    expect(res.status).not.toBe(400);
  });
});
