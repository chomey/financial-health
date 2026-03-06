import { NextRequest, NextResponse } from "next/server";

// 4-hour in-memory cache
const fxCache = new Map<string, { rate: number; timestamp: string; expiry: number }>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const VALID_CURRENCIES = new Set(["CAD", "USD"]);

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = request.nextUrl.searchParams.get("to")?.toUpperCase();

  if (!from || !to || !VALID_CURRENCIES.has(from) || !VALID_CURRENCIES.has(to)) {
    return NextResponse.json(
      { error: "Invalid currency. Supported: CAD, USD" },
      { status: 400 },
    );
  }

  if (from === to) {
    return NextResponse.json({ rate: 1, timestamp: new Date().toISOString(), source: "identity" });
  }

  const cacheKey = `${from}_${to}`;

  // Check cache
  const cached = fxCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json({
      rate: cached.rate,
      timestamp: cached.timestamp,
      source: "cache",
    });
  }

  try {
    // Use open.er-api.com (free, no key required)
    const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exchange rate" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const rate = data?.rates?.[to];

    if (rate === undefined || rate === null) {
      return NextResponse.json(
        { error: "Rate not available" },
        { status: 404 },
      );
    }

    const timestamp = new Date().toISOString();

    // Cache both directions
    fxCache.set(cacheKey, { rate, timestamp, expiry: Date.now() + CACHE_TTL_MS });
    const reverseKey = `${to}_${from}`;
    fxCache.set(reverseKey, { rate: 1 / rate, timestamp, expiry: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({
      rate,
      timestamp,
      source: "live",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 502 },
    );
  }
}
