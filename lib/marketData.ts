import type { MarketData } from "@/lib/types";

const BINANCE_MARKET_DATA_URL = "https://data-api.binance.vision/api/v3/ticker/24hr";
const OKX_TICKER_URL = "https://www.okx.com/api/v5/market/ticker";
const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

const coinGeckoIds: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  MEME: "meme"
};

const exampleData: Record<string, Omit<MarketData, "updatedAt" | "source" | "dataSource" | "sourceNote">> = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    price: 68420,
    change24h: 2.8,
    change24hText: "2.80",
    volume24h: 24500,
    quoteVolume24h: 1676290000,
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
    quoteVolume24h: 649376000,
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
    quoteVolume24h: 1099440000,
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
    quoteVolume24h: 2744000,
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
  quoteVolume: string;
  closeTime: number;
};

type OkxTickerResponse = {
  code: string;
  data?: Array<{
    instId: string;
    last: string;
    open24h: string;
    vol24h: string;
    volCcy24h: string;
    ts: string;
  }>;
};

type CoinGeckoResponse = Record<string, {
  usd?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
}>;

export async function getMarketData(symbolInput: string): Promise<{ data?: MarketData; error?: string }> {
  const symbol = normalizeSymbol(symbolInput);

  try {
    const data = await getMarketDataFromPublicApi(symbol);
    return { data };
  } catch (error) {
    if (error instanceof InvalidSymbolError) {
      return { error: "暂未找到该交易对，请检查输入是否正确。" };
    }

    return { error: "暂时无法获取该交易对的公开行情数据，请稍后刷新或更换交易对。" };
  }
}

export function normalizeSymbol(symbolInput: string) {
  const cleaned = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned || "BTCUSDT";
}

export async function getMarketDataFromPublicApi(symbolInput: string): Promise<MarketData> {
  const symbol = normalizeSymbol(symbolInput);
  const errors: unknown[] = [];
  let sawInvalidSymbol = false;

  for (const loader of [fetchBinanceMarketData, fetchOkxMarketData, fetchCoinGeckoMarketData]) {
    try {
      return await loader(symbol);
    } catch (error) {
      if (error instanceof InvalidSymbolError) {
        sawInvalidSymbol = true;
      } else {
        errors.push(error);
      }
    }
  }

  if (sawInvalidSymbol && errors.length === 0) {
    throw new InvalidSymbolError();
  }

  throw errors[0] instanceof Error ? errors[0] : new Error("All market data sources failed");
}

async function fetchBinanceMarketData(symbol: string): Promise<MarketData> {
  const response = await fetch(`${BINANCE_MARKET_DATA_URL}?symbol=${encodeURIComponent(symbol)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4500)
  });

  if (response.status === 400 || response.status === 404) {
    throw new InvalidSymbolError();
  }

  if (!response.ok) {
    throw new Error(`Binance market data request failed: ${response.status}`);
  }

  const ticker = (await response.json()) as BinanceTicker24h;
  const volume24h = Number(ticker.volume);
  const quoteVolume24h = Number(ticker.quoteVolume);
  const price = Number(ticker.lastPrice);

  if (!ticker.symbol || !Number.isFinite(price) || !Number.isFinite(volume24h) || !Number.isFinite(quoteVolume24h)) {
    throw new Error("Invalid Binance ticker payload");
  }

  return buildMarketData({
    symbol: ticker.symbol,
    price,
    change24h: parseNullableNumber(ticker.priceChangePercent),
    volume24h,
    quoteVolume24h,
    updatedAt: new Date(ticker.closeTime).toISOString(),
    dataSource: "Binance 公共行情"
  });
}

async function fetchOkxMarketData(symbol: string): Promise<MarketData> {
  const instId = toOkxInstId(symbol);
  const response = await fetch(`${OKX_TICKER_URL}?instId=${encodeURIComponent(instId)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4500)
  });

  if (!response.ok) {
    throw new Error(`OKX market data request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OkxTickerResponse;
  const ticker = payload.data?.[0];
  if (payload.code !== "0" || !ticker) {
    throw new InvalidSymbolError();
  }

  const price = Number(ticker.last);
  const open24h = Number(ticker.open24h);
  const volume24h = Number(ticker.vol24h);
  const quoteVolume24h = Number(ticker.volCcy24h);
  const timestamp = Number(ticker.ts);
  const change24h = open24h > 0 ? ((price - open24h) / open24h) * 100 : null;

  if (!Number.isFinite(price) || !Number.isFinite(volume24h) || !Number.isFinite(quoteVolume24h) || !Number.isFinite(timestamp)) {
    throw new Error("Invalid OKX ticker payload");
  }

  return buildMarketData({
    symbol,
    price,
    change24h,
    volume24h,
    quoteVolume24h,
    updatedAt: new Date(timestamp).toISOString(),
    dataSource: "OKX 公共行情"
  });
}

async function fetchCoinGeckoMarketData(symbol: string): Promise<MarketData> {
  const baseAsset = getBaseAsset(symbol);
  const id = coinGeckoIds[baseAsset];
  if (!id) {
    throw new InvalidSymbolError();
  }

  const params = new URLSearchParams({
    ids: id,
    vs_currencies: "usd",
    include_24hr_vol: "true",
    include_24hr_change: "true",
    include_last_updated_at: "true"
  });
  const response = await fetch(`${COINGECKO_PRICE_URL}?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4500)
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const payload = (await response.json()) as CoinGeckoResponse;
  const item = payload[id];
  const price = item?.usd;
  const quoteVolume24h = item?.usd_24h_vol ?? 0;
  const volume24h = price && price > 0 ? quoteVolume24h / price : 0;
  const updatedAt = item?.last_updated_at ? new Date(item.last_updated_at * 1000).toISOString() : new Date().toISOString();

  if (!price || !Number.isFinite(price)) {
    throw new InvalidSymbolError();
  }

  return buildMarketData({
    symbol,
    price,
    change24h: typeof item?.usd_24h_change === "number" ? item.usd_24h_change : null,
    volume24h,
    quoteVolume24h,
    updatedAt,
    dataSource: "CoinGecko 聚合行情",
    sourceNote: "该数据来自第三方聚合行情，可能与具体交易所略有差异。"
  });
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

export function getExampleSymbols() {
  return Object.keys(exampleData);
}

function buildMarketData({
  symbol,
  price,
  change24h,
  volume24h,
  quoteVolume24h,
  updatedAt,
  dataSource,
  sourceNote
}: {
  symbol: string;
  price: number;
  change24h: number | null;
  volume24h: number;
  quoteVolume24h: number;
  updatedAt: string;
  dataSource: MarketData["dataSource"];
  sourceNote?: string;
}): MarketData {
  const base = exampleData[symbol] ?? estimateDemoMetrics(symbol);

  return {
    ...base,
    symbol,
    price,
    change24h,
    change24hText: normalizePercentNumber(change24h),
    volume24h,
    quoteVolume24h,
    volumeChange: estimateVolumeChange(volume24h),
    source: "api",
    dataSource,
    sourceNote,
    updatedAt
  };
}

function toOkxInstId(symbol: string) {
  const baseAsset = getBaseAsset(symbol);
  if (!baseAsset) {
    throw new InvalidSymbolError();
  }

  return `${baseAsset}-USDT`;
}

function getBaseAsset(symbol: string) {
  if (!symbol.endsWith("USDT") || symbol.length <= 4) {
    throw new InvalidSymbolError();
  }

  return symbol.slice(0, -4);
}

function estimateDemoMetrics(symbol: string): Omit<MarketData, "symbol" | "price" | "change24h" | "change24hText" | "volume24h" | "quoteVolume24h" | "updatedAt" | "source" | "dataSource" | "sourceNote"> {
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

function normalizePercentNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return value.toFixed(2);
}

export class InvalidSymbolError extends Error {}
