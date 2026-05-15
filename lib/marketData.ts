import { findSimilarSymbols, findSymbolSources, getSymbolRegistry, resolveSymbol, toOkxInstId } from "@/lib/symbols";
import type { MarketData } from "@/lib/types";

const BINANCE_MARKET_DATA_URL = "https://data-api.binance.vision/api/v3/ticker/24hr";
const OKX_TICKER_URL = "https://www.okx.com/api/v5/market/ticker";
const MEXC_TICKER_URL = "https://api.mexc.com/api/v3/ticker/24hr";
const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

const coinGeckoIds: Record<string, string> = {
  BTC: "bitcoin",
  DOGE: "dogecoin",
  ETH: "ethereum",
  MEME: "meme",
  PEPE: "pepe",
  SOL: "solana",
  WIF: "dogwifcoin"
};

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
    volumeChange: 126,
    fundingRate: 0.074,
    openInterestChange: 22.4,
    volatility: 9.1
  }
};

type BinanceTicker24h = {
  openPrice: string;
  symbol: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  closeTime: number;
};

type OkxTickerResponse = {
  code: string;
  data?: Array<{
    last: string;
    open24h: string;
    ts: string;
    vol24h: string;
    volCcy24h: string;
  }>;
};

type MexcTicker24h = {
  symbol: string;
  lastPrice: string;
  openPrice: string;
  volume: string;
  quoteVolume?: string;
  closeTime?: number;
};

type CoinGeckoResponse = Record<string, {
  last_updated_at?: number;
  usd?: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
}>;

export async function getMarketData(symbolInput: string): Promise<{ data?: MarketData; error?: string }> {
  try {
    const data = await getMarketDataFromPublicApi(symbolInput);
    return { data };
  } catch (error) {
    if (error instanceof InvalidSymbolError) {
      return { error: error.message || "暂未找到该交易对，请检查输入是否正确，或尝试 BTCUSDT / ETHUSDT / SOLUSDT。" };
    }

    if (error instanceof IncompleteMarketDataError) {
      return { error: "该数据源暂未返回完整行情字段，请更换交易对或稍后刷新。" };
    }

    return { error: "暂时无法获取该交易对的公开行情数据，请稍后刷新或更换交易对。" };
  }
}

export function normalizeSymbol(symbolInput: string) {
  return resolveSymbol(symbolInput).normalized;
}

export async function getMarketDataFromPublicApi(symbolInput: string): Promise<MarketData> {
  const resolved = resolveSymbol(symbolInput);
  const registry = await getSymbolRegistry();
  const sources = findSymbolSources(resolved.normalized, registry);
  const suggestions = findSimilarSymbols(resolved, registry);
  const errors: unknown[] = [];

  if (sources.length === 0 && !canUseCoinGecko(resolved.normalized)) {
    throw new InvalidSymbolError(buildNotFoundMessage(suggestions));
  }

  for (const source of ["binance", "okx", "mexc"] as const) {
    if (!sources.includes(source)) continue;

    try {
      if (source === "binance") return await fetchBinanceMarketData(resolved.normalized);
      if (source === "okx") return await fetchOkxMarketData(resolved.normalized);
      return await fetchMexcMarketData(resolved.normalized);
    } catch (error) {
      errors.push(error);
    }
  }

  if (canUseCoinGecko(resolved.normalized)) {
    try {
      return await fetchCoinGeckoMarketData(resolved.normalized);
    } catch (error) {
      errors.push(error);
    }
  }

  if (sources.length === 0) {
    throw new InvalidSymbolError(buildNotFoundMessage(suggestions));
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
  return buildMarketDataFromExchangeTicker({
    symbol: ticker.symbol,
    price: ticker.lastPrice,
    openPrice: ticker.openPrice,
    volume24h: ticker.volume,
    quoteVolume24h: ticker.quoteVolume,
    updatedAt: ticker.closeTime ? new Date(ticker.closeTime).toISOString() : new Date().toISOString(),
    dataSource: "Binance 公共行情"
  });
}

async function fetchOkxMarketData(symbol: string): Promise<MarketData> {
  const response = await fetch(`${OKX_TICKER_URL}?instId=${encodeURIComponent(toOkxInstId(symbol))}`, {
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
  const timestamp = Number(ticker.ts);

  return buildMarketData({
    symbol,
    price,
    openPrice: open24h,
    volume24h: Number(ticker.vol24h),
    quoteVolume24h: Number(ticker.volCcy24h),
    updatedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString(),
    dataSource: "OKX 公共行情"
  });
}

async function fetchMexcMarketData(symbol: string): Promise<MarketData> {
  const response = await fetch(`${MEXC_TICKER_URL}?symbol=${encodeURIComponent(symbol)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4500)
  });

  if (response.status === 400 || response.status === 404) {
    throw new InvalidSymbolError();
  }

  if (!response.ok) {
    throw new Error(`MEXC market data request failed: ${response.status}`);
  }

  const ticker = (await response.json()) as MexcTicker24h;
  const price = Number(ticker.lastPrice);
  const volume24h = Number(ticker.volume);
  const quoteVolume24h = Number(ticker.quoteVolume);
  const hasQuoteVolume = ticker.quoteVolume !== undefined && ticker.quoteVolume !== "" && Number.isFinite(quoteVolume24h);

  return buildMarketDataFromExchangeTicker({
    symbol: ticker.symbol || symbol,
    price: ticker.lastPrice,
    openPrice: ticker.openPrice,
    volume24h: ticker.volume,
    quoteVolume24h: hasQuoteVolume ? ticker.quoteVolume as string : String(volume24h * price),
    quoteVolumeEstimated: !hasQuoteVolume,
    updatedAt: ticker.closeTime ? new Date(ticker.closeTime).toISOString() : new Date().toISOString(),
    dataSource: "MEXC 公共行情"
  });
}

async function fetchCoinGeckoMarketData(symbol: string): Promise<MarketData> {
  const resolved = resolveSymbol(symbol);
  const id = coinGeckoIds[resolved.baseAsset];
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
  const change24h = typeof item?.usd_24h_change === "number" ? item.usd_24h_change : null;
  const openPrice = price && change24h !== null ? price / (1 + change24h / 100) : null;
  const updatedAt = item?.last_updated_at ? new Date(item.last_updated_at * 1000).toISOString() : new Date().toISOString();

  if (!price || !Number.isFinite(price) || openPrice === null || !Number.isFinite(openPrice)) {
    throw new IncompleteMarketDataError();
  }

  return buildMarketData({
    symbol,
    price,
    openPrice,
    volume24h,
    quoteVolume24h,
    updatedAt,
    dataSource: "CoinGecko 聚合行情",
    sourceNote: "该数据来自第三方聚合行情，可能与具体交易所价格略有差异。"
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

function buildMarketDataFromExchangeTicker({
  symbol,
  price,
  openPrice,
  volume24h,
  quoteVolume24h,
  quoteVolumeEstimated,
  updatedAt,
  dataSource
}: {
  symbol: string;
  price: string;
  openPrice: string;
  volume24h: string;
  quoteVolume24h: string;
  quoteVolumeEstimated?: boolean;
  updatedAt: string;
  dataSource: MarketData["dataSource"];
}) {
  return buildMarketData({
    symbol,
    price: Number(price),
    openPrice: Number(openPrice),
    volume24h: Number(volume24h),
    quoteVolume24h: Number(quoteVolume24h),
    quoteVolumeEstimated,
    updatedAt,
    dataSource
  });
}

function buildMarketData({
  symbol,
  price,
  openPrice,
  volume24h,
  quoteVolume24h,
  quoteVolumeEstimated,
  updatedAt,
  dataSource,
  sourceNote
}: {
  symbol: string;
  price: number;
  openPrice: number | null;
  volume24h: number;
  quoteVolume24h: number;
  quoteVolumeEstimated?: boolean;
  updatedAt: string;
  dataSource: MarketData["dataSource"];
  sourceNote?: string;
}): MarketData {
  if (!Number.isFinite(price) || !Number.isFinite(volume24h) || !Number.isFinite(quoteVolume24h) || openPrice === null || !Number.isFinite(openPrice) || openPrice <= 0) {
    throw new IncompleteMarketDataError();
  }

  const base = exampleData[symbol] ?? estimateDemoMetrics(symbol);
  const resolved = resolveSymbol(symbol);
  const change24h = ((price - openPrice) / openPrice) * 100;

  return {
    ...base,
    baseAsset: resolved.baseAsset,
    symbol,
    quoteAsset: resolved.quoteAsset,
    price,
    change24h,
    change24hText: normalizePercentNumber(change24h),
    volume24h,
    quoteVolume24h,
    quoteVolumeEstimated,
    volumeChange: estimateVolumeChange(volume24h),
    source: "api",
    dataSource,
    sourceNote,
    updatedAt
  };
}

function canUseCoinGecko(symbol: string) {
  const resolved = resolveSymbol(symbol);
  return ["USDT", "USDC", "FDUSD"].includes(resolved.quoteAsset) && Boolean(coinGeckoIds[resolved.baseAsset]);
}

function buildNotFoundMessage(suggestions: string[]) {
  if (suggestions.length > 0) {
    return `暂未找到该交易对，请检查输入是否正确。找到相近交易对：${suggestions.join("、")}`;
  }

  return "暂未找到该交易对，请检查输入是否正确，或尝试 BTCUSDT / ETHUSDT / SOLUSDT。";
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

function estimateVolumeChange(volume24h: number) {
  if (volume24h >= 500000000) return 86;
  if (volume24h >= 100000000) return 58;
  if (volume24h >= 10000000) return 36;
  return 18;
}

function normalizePercentNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return value.toFixed(2);
}

export class InvalidSymbolError extends Error {}
export class IncompleteMarketDataError extends Error {}
