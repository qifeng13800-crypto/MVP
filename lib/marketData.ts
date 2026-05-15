import type { MarketData } from "@/lib/types";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

const fallbackData: Record<string, Omit<MarketData, "updatedAt" | "source">> = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    price: 68420,
    change24h: 2.8,
    change24hText: "2.80",
    volume24h: 24500,
    volumeChange: 48,
    fundingRate: 0.018,
    openInterestChange: 6.5,
    volatility: 6.2
  },
  ETHUSDT: {
    symbol: "ETHUSDT",
    price: 3568,
    change24h: 1.2,
    change24hText: "1.20",
    volume24h: 182000,
    volumeChange: 18,
    fundingRate: 0.009,
    openInterestChange: 2.1,
    volatility: 3.4
  },
  SOLUSDT: {
    symbol: "SOLUSDT",
    price: 152.7,
    change24h: 4.6,
    change24hText: "4.60",
    volume24h: 7200000,
    volumeChange: 42,
    fundingRate: 0.021,
    openInterestChange: 7.4,
    volatility: 6.1
  },
  MEMEUSDT: {
    symbol: "MEMEUSDT",
    price: 0.0028,
    change24h: 12.6,
    change24hText: "12.60",
    volume24h: 980000000,
    volumeChange: 126,
    fundingRate: 0.074,
    openInterestChange: 22.4,
    volatility: 9.1
  }
};

type BinanceTicker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
};

export async function getMarketData(symbolInput: string): Promise<{ data?: MarketData; error?: string }> {
  const symbol = normalizeSymbol(symbolInput);

  try {
    const data = await getMarketDataFromPublicApi(symbol);
    return { data };
  } catch (error) {
    if (error instanceof InvalidSymbolError) {
      return { error: "暂未找到该交易对，请检查输入是否正确。" };
    }

    const fallback = getFallbackData(symbol);
    if (fallback) {
      return { data: fallback };
    }

    return { error: "暂未找到该交易对，请检查输入是否正确。" };
  }
}

export function normalizeSymbol(symbolInput: string) {
  const cleaned = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned || "BTCUSDT";
}

export async function getMarketDataFromPublicApi(symbolInput: string): Promise<MarketData> {
  const symbol = normalizeSymbol(symbolInput);
  const response = await fetch(`${BINANCE_TICKER_URL}?symbol=${encodeURIComponent(symbol)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4500)
  });

  if (response.status === 400 || response.status === 404) {
    throw new InvalidSymbolError();
  }

  if (!response.ok) {
    throw new Error(`Binance request failed: ${response.status}`);
  }

  const ticker = (await response.json()) as BinanceTicker24h;
  const base = fallbackData[symbol] ?? estimateDemoMetrics(symbol);
  const volume24h = Number(ticker.volume);

  return {
    ...base,
    symbol: ticker.symbol,
    price: Number(ticker.lastPrice),
    change24h: parseNullableNumber(ticker.priceChangePercent),
    change24hText: normalizePercentText(ticker.priceChangePercent),
    volume24h,
    volumeChange: estimateVolumeChange(volume24h),
    source: "api",
    updatedAt: new Date().toISOString()
  };
}

function getFallbackData(symbol: string): MarketData | undefined {
  const data = fallbackData[symbol];
  if (!data) return undefined;

  return {
    ...data,
    source: "fallback",
    updatedAt: new Date().toISOString()
  };
}

function estimateDemoMetrics(symbol: string): Omit<MarketData, "symbol" | "price" | "change24h" | "change24hText" | "volume24h" | "updatedAt" | "source"> {
  const seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    volumeChange: Number((10 + (seed % 90)).toFixed(1)),
    fundingRate: Number((((seed % 150) - 55) / 1000).toFixed(3)),
    openInterestChange: Number((((seed % 360) - 130) / 10).toFixed(1)),
    volatility: Number((2 + (seed % 85) / 10).toFixed(1))
  };
}

function estimateVolumeChange(volume24h: number) {
  if (volume24h >= 500000000) return 86;
  if (volume24h >= 100000000) return 58;
  if (volume24h >= 10000000) return 36;
  return 18;
}

function parseNullableNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePercentText(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed.toFixed(2);
}

class InvalidSymbolError extends Error {}
