import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/stock-price/route";
import { NextRequest } from "next/server";

function makeRequest(ticker: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/stock-price?ticker=${ticker}`);
}

describe("Stock price API route", () => {
  it("returns 400 for missing ticker", async () => {
    const req = new NextRequest("http://localhost:3000/api/stock-price");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid ticker symbol");
  });

  it("returns 400 for invalid ticker format", async () => {
    const res = await GET(makeRequest("aapl")); // lowercase
    expect(res.status).toBe(400);
  });

  it("returns 400 for ticker with special chars", async () => {
    const res = await GET(makeRequest("A%20B"));
    expect(res.status).toBe(400);
  });

  it("accepts valid ticker format", async () => {
    // This test hits the real API, so it may fail in CI without network.
    // We just test that the route doesn't crash for a valid ticker format.
    const res = await GET(makeRequest("AAPL"));
    // Could be 200 (success) or 404/502 (API unavailable) — just not 400
    expect(res.status).not.toBe(400);
  });

  it("accepts ticker with dots (e.g., BRK.B)", async () => {
    const res = await GET(makeRequest("BRK.B"));
    expect(res.status).not.toBe(400);
  });
});
