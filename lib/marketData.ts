import { resolveSymbol } from "@/lib/symbols";
import type { MarketData } from "@/lib/types";

const BINANCE_FUTURES_TICKER_URL = "https://fapi.binance.com/fapi/v1/ticker/24hr";

const exampleData: Record<string, Omit<MarketData, "updatedAt" | "source" | "dataSource" | "sourceNote">> = {
  BTCUSDT: {
    baseAsset: "BTC",
    symbol: "BTCUSDT",
    quoteAsset: "USDT",
    price: 68420,
    change24h: 2.8,
    change24hText: "2.80",
    volume24h: 24500,
    quoteVolume24h: 1676290000,
    quoteVolumeEstimated: false,
    volumeChange: 48,
    fundingRate: 0.018,
    openInterestChange: 6.5,
    volatility: 6.2
  },
  ETHUSDT: {
    baseAsset: "ETH",
    symbol: "ETHUSDT",
    quoteAsset: "USDT",
    price: 3568,
    change24h: 1.2,
    change24hText: "1.20",
    volume24h: 182000,
    quoteVolume24h: 649376000,
    quoteVolumeEstimated: false,
    volumeChange: 18,
    fundingRate: 0.009,
    openInterestChange: 2.1,
    volatility: 3.4
  },
  SOLUSDT: {
    baseAsset: "SOL",
    symbol: "SOLUSDT",
    quoteAsset: "USDT",
    price: 152.7,
    change24h: 4.6,
    change24hText: "4.60",
    volume24h: 7200000,
    quoteVolume24h: 1099440000,
    quoteVolumeEstimated: false,
    volumeChange: 42,
    fundingRate: 0.021,
    openInterestChange: 7.4,
    volatility: 6.1
  },
  MEMEUSDT: {
    baseAsset: "MEME",
    symbol: "MEMEUSDT",
    quoteAsset: "USDT",
    price: 0.0028,
    change24h: 12.6,
    change24hText: "12.60",
    volume24h: 980000000,
    quoteVolume24h: 2744000,
    quoteVolumeEstimated: false,
    volumeChange: 126,
    fundingRate: 0.074,
    openInterestChange: 22.4,
    volatility: 9.1
  }
};

type BinanceFuturesTicker24h = {
  closeTime: number;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  symbol: string;
  volume: string;
};

export async function getMarketData(symbolInput: string): Promise<{ data?: MarketData; error?: string }> {
  try {
    const data = await getMarketDataFromPublicApi(symbolInput);
    return { data };
  } catch (error) {
    if (error instanceof InvalidSymbolError) {
      return { error: "暂未找到该交易对，请检查输入是否正确，或尝试 BTCUSDT / ETHUSDT / SOLUSDT。" };
    }

    if (error instanceof IncompleteMarketDataError) {
      return { error: "该数据源暂未返回完整行情字段，请更换交易对或稍后刷新。" };
    }

    return { error: "暂时无法获取 Binance 合约公开行情，请稍后刷新。" };
  }
}

export function normalizeSymbol(symbolInput: string) {
  return resolveSymbol(symbolInput).normalized;
}

export async function getMarketDataFromPublicApi(symbolInput: string): Promise<MarketData> {
  const resolved = resolveSymbol(symbolInput);
  const response = await fetch(`${BINANCE_FUTURES_TICKER_URL}?symbol=${encodeURIComponent(resolved.normalized)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(6000)
  });

  if (response.status === 400 || response.status === 404) {
    throw new InvalidSymbolError();
  }

  if (!response.ok) {
    throw new Error(`Binance futures request failed: ${response.status}`);
  }

  const ticker = (await response.json()) as BinanceFuturesTicker24h;
  return buildMarketDataFromFuturesTicker(ticker);
}

export function getExampleMarketData(symbolInput: string): MarketData {
  const symbol = normalizeSymbol(symbolInput);
  const data = exampleData[symbol] ?? exampleData.BTCUSDT;

  return {
    ...data,
    source: "example",
    dataSource: "示例报告数据",
    updatedAt: new Date().toISOString()
  };
}

function buildMarketDataFromFuturesTicker(ticker: BinanceFuturesTicker24h): MarketData {
  const resolved = resolveSymbol(ticker.symbol);
  const price = Number(ticker.lastPrice);
  const change24h = Number(ticker.priceChangePercent);
  const volume24h = Number(ticker.volume);
  const quoteVolume24h = Number(ticker.quoteVolume);

  if (!ticker.symbol || !Number.isFinite(price) || !Number.isFinite(change24h) || !Number.isFinite(volume24h) || !Number.isFinite(quoteVolume24h)) {
    throw new IncompleteMarketDataError();
  }

  const base = exampleData[ticker.symbol] ?? estimateDemoMetrics(ticker.symbol);

  return {
    ...base,
    baseAsset: resolved.baseAsset,
    symbol: ticker.symbol,
    quoteAsset: resolved.quoteAsset,
    price,
    change24h,
    change24hText: change24h.toFixed(2),
    volume24h,
    quoteVolume24h,
    quoteVolumeEstimated: false,
    volumeChange: estimateVolumeChange(quoteVolume24h),
    source: "api",
    dataSource: "Binance U 本位合约公开行情",
    updatedAt: ticker.closeTime ? new Date(ticker.closeTime).toISOString() : new Date().toISOString()
  };
}

function estimateDemoMetrics(symbol: string): Omit<MarketData, "baseAsset" | "symbol" | "quoteAsset" | "price" | "change24h" | "change24hText" | "volume24h" | "quoteVolume24h" | "quoteVolumeEstimated" | "updatedAt" | "source" | "dataSource" | "sourceNote"> {
  const seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    fundingRate: Number((((seed % 150) - 55) / 1000).toFixed(3)),
    openInterestChange: Number((((seed % 360) - 130) / 10).toFixed(1)),
    volatility: Number((2 + (seed % 85) / 10).toFixed(1)),
    volumeChange: Number((10 + (seed % 90)).toFixed(1))
  };
}

function estimateVolumeChange(quoteVolume24h: number) {
  if (quoteVolume24h >= 500000000) return 86;
  if (quoteVolume24h >= 100000000) return 58;
  if (quoteVolume24h >= 10000000) return 36;
  return 18;
}

export class InvalidSymbolError extends Error {}
export class IncompleteMarketDataError extends Error {}
