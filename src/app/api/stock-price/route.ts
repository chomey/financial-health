import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache to avoid hammering the API
const priceCache = new Map<string, { price: number; timestamp: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker || !/^[A-Z0-9.]{1,10}$/.test(ticker)) {
    return NextResponse.json(
      { error: "Invalid ticker symbol" },
      { status: 400 }
    );
  }

  // Check cache
  const cached = priceCache.get(ticker);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json({
      ticker,
      price: cached.price,
      timestamp: cached.timestamp,
      cached: true,
    });
  }

  try {
    // Use Yahoo Finance chart API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Ticker not found", ticker },
        { status: 404 }
      );
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;

    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: "Price not available", ticker },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString();

    // Cache the result
    priceCache.set(ticker, {
      price,
      timestamp,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json({
      ticker,
      price,
      timestamp,
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch price", ticker },
      { status: 502 }
    );
  }
}
