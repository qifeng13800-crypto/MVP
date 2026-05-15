import { resolveSymbol } from "@/lib/symbols";
import type { MarketData } from "@/lib/types";

const BINANCE_FUTURES_TICKER_URLS = [
  "https://fapi.binance.com/fapi/v1/ticker/24hr",
  "https://fapi1.binance.com/fapi/v1/ticker/24hr",
  "https://fapi2.binance.com/fapi/v1/ticker/24hr",
  "https://fapi3.binance.com/fapi/v1/ticker/24hr",
  "https://fapi4.binance.com/fapi/v1/ticker/24hr"
];

const OKX_SWAP_TICKER_URL = "https://www.okx.com/api/v5/market/ticker";
const MEXC_CONTRACT_TICKER_URL = "https://contract.mexc.com/api/v1/contract/ticker";

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
  closeTime?: number;
  lastPrice?: string;
  priceChangePercent?: string;
  quoteVolume?: string;
  symbol?: string;
  volume?: string;
};

type OkxTickerResponse = {
  code?: string;
  data?: Array<{
    instId?: string;
    last?: string;
    open24h?: string;
    ts?: string;
    volCcy24h?: string;
    volCcyQuote24h?: string;
  }>;
};

type MexcContractTickerResponse = {
  code?: number;
  data?: {
    amount24?: number | string;
    lastPrice?: number | string;
    riseFallRate?: number | string;
    symbol?: string;
    timestamp?: number;
    volume24?: number | string;
  };
  success?: boolean;
};

type SourceAttempt = {
  name: string;
  load: () => Promise<MarketData>;
};

export async function getMarketData(symbolInput: string): Promise<{ data?: MarketData; error?: string }> {
  try {
    const data = await getMarketDataFromPublicApi(symbolInput);
    return { data };
  } catch (error) {
    if (error instanceof InvalidSymbolError) {
      return { error: "暂未找到该交易对，请检查输入是否正确。" };
    }

    if (error instanceof IncompleteMarketDataError) {
      return { error: "该数据源暂未返回完整行情字段，请更换交易对或稍后刷新。" };
    }

    return { error: "暂时无法获取该交易对的合约公开行情，请稍后刷新或更换交易对。" };
  }
}

export function normalizeSymbol(symbolInput: string) {
  return resolveSymbol(symbolInput).normalized;
}

export async function getMarketDataFromPublicApi(symbolInput: string): Promise<MarketData> {
  const resolved = resolveSymbol(symbolInput);
  const attempts: SourceAttempt[] = [
    {
      name: "Binance U本位合约",
      load: () => fetchBinanceFuturesMarketData(resolved.normalized)
    },
    {
      name: "OKX 永续合约",
      load: () => fetchOkxSwapMarketData(resolved.normalized)
    },
    {
      name: "MEXC 合约行情",
      load: () => fetchMexcContractMarketData(resolved.normalized)
    }
  ];
  let sawTemporaryFailure = false;
  let sawIncompleteData = false;

  for (const attempt of attempts) {
    try {
      return await attempt.load();
    } catch (error) {
      if (error instanceof IncompleteMarketDataError) {
        sawIncompleteData = true;
        continue;
      }

      if (error instanceof InvalidSymbolError) {
        continue;
      }

      sawTemporaryFailure = true;
    }
  }

  if (sawTemporaryFailure) {
    throw new Error("All futures market data sources failed");
  }

  if (sawIncompleteData) {
    throw new IncompleteMarketDataError();
  }

  throw new InvalidSymbolError();
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

async function fetchBinanceFuturesMarketData(symbol: string) {
  let lastError: unknown;

  for (const url of BINANCE_FUTURES_TICKER_URLS) {
    try {
      const response = await fetch(`${url}?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(9000)
      });

      if (response.status === 400 || response.status === 404) {
        throw new InvalidSymbolError();
      }

      if (!response.ok) {
        lastError = new Error(`Binance futures request failed: ${response.status}`);
        continue;
      }

      const ticker = (await response.json()) as BinanceFuturesTicker24h;
      return buildMarketDataFromBinanceFutures(ticker);
    } catch (error) {
      if (error instanceof InvalidSymbolError) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Binance futures request failed");
}

async function fetchOkxSwapMarketData(symbol: string) {
  const resolved = resolveSymbol(symbol);
  const instId = `${resolved.baseAsset}-${resolved.quoteAsset}-SWAP`;
  const response = await fetch(`${OKX_SWAP_TICKER_URL}?instId=${encodeURIComponent(instId)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) {
    throw new Error(`OKX swap request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OkxTickerResponse;
  const ticker = payload.data?.[0];

  if (payload.code !== "0" || !ticker) {
    throw new InvalidSymbolError();
  }

  return buildMarketDataFromOkxSwap(symbol, ticker);
}

async function fetchMexcContractMarketData(symbol: string) {
  const resolved = resolveSymbol(symbol);
  const mexcSymbol = `${resolved.baseAsset}_${resolved.quoteAsset}`;
  const response = await fetch(`${MEXC_CONTRACT_TICKER_URL}?symbol=${encodeURIComponent(mexcSymbol)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) {
    throw new Error(`MEXC contract request failed: ${response.status}`);
  }

  const payload = (await response.json()) as MexcContractTickerResponse;
  if (!payload.success || !payload.data) {
    throw new InvalidSymbolError();
  }

  return buildMarketDataFromMexcContract(symbol, payload.data);
}

function buildMarketDataFromBinanceFutures(ticker: BinanceFuturesTicker24h): MarketData {
  const symbol = ticker.symbol ?? "";
  const resolved = resolveSymbol(symbol);
  const price = Number(ticker.lastPrice);
  const change24h = Number(ticker.priceChangePercent);
  const volume24h = Number(ticker.volume);
  const quoteVolume24h = Number(ticker.quoteVolume);

  if (!symbol || !Number.isFinite(price) || !Number.isFinite(change24h) || !Number.isFinite(volume24h) || !Number.isFinite(quoteVolume24h)) {
    throw new IncompleteMarketDataError();
  }

  return buildMarketData({
    baseAsset: resolved.baseAsset,
    change24h,
    dataSource: "Binance U本位合约",
    price,
    quoteAsset: resolved.quoteAsset,
    quoteVolume24h,
    symbol,
    updatedAt: ticker.closeTime ? new Date(ticker.closeTime).toISOString() : new Date().toISOString(),
    volume24h
  });
}

function buildMarketDataFromOkxSwap(symbol: string, ticker: NonNullable<OkxTickerResponse["data"]>[number]): MarketData {
  const resolved = resolveSymbol(symbol);
  const price = Number(ticker.last);
  const open24h = Number(ticker.open24h);
  const volume24h = Number(ticker.volCcy24h);
  const quoteVolume24h = ticker.volCcyQuote24h ? Number(ticker.volCcyQuote24h) : null;

  if (!Number.isFinite(price) || !Number.isFinite(open24h) || open24h <= 0 || !Number.isFinite(volume24h)) {
    throw new IncompleteMarketDataError();
  }

  const change24h = ((price - open24h) / open24h) * 100;

  return buildMarketData({
    baseAsset: resolved.baseAsset,
    change24h,
    dataSource: "OKX 永续合约",
    price,
    quoteAsset: resolved.quoteAsset,
    quoteVolume24h: Number.isFinite(quoteVolume24h) ? quoteVolume24h : null,
    sourceNote: "该数据不是 Binance 合约数据，可能与 Binance 页面存在差异。",
    symbol: resolved.normalized,
    updatedAt: ticker.ts ? new Date(Number(ticker.ts)).toISOString() : new Date().toISOString(),
    volume24h
  });
}

function buildMarketDataFromMexcContract(symbol: string, ticker: NonNullable<MexcContractTickerResponse["data"]>): MarketData {
  const resolved = resolveSymbol(symbol);
  const price = Number(ticker.lastPrice);
  const volume24h = Number(ticker.volume24);
  const quoteVolume24h = ticker.amount24 === undefined ? null : Number(ticker.amount24);
  const riseFallRate = Number(ticker.riseFallRate);

  if (!Number.isFinite(price) || !Number.isFinite(volume24h) || !Number.isFinite(riseFallRate)) {
    throw new IncompleteMarketDataError();
  }

  return buildMarketData({
    baseAsset: resolved.baseAsset,
    change24h: riseFallRate * 100,
    dataSource: "MEXC 合约行情",
    price,
    quoteAsset: resolved.quoteAsset,
    quoteVolume24h: Number.isFinite(quoteVolume24h) ? quoteVolume24h : null,
    sourceNote: "该数据不是 Binance 合约数据，可能与 Binance 页面存在差异。",
    symbol: resolved.normalized,
    updatedAt: ticker.timestamp ? new Date(Number(ticker.timestamp)).toISOString() : new Date().toISOString(),
    volume24h
  });
}

function buildMarketData({
  baseAsset,
  change24h,
  dataSource,
  price,
  quoteAsset,
  quoteVolume24h,
  sourceNote,
  symbol,
  updatedAt,
  volume24h
}: {
  baseAsset: string;
  change24h: number;
  dataSource: MarketData["dataSource"];
  price: number;
  quoteAsset: string;
  quoteVolume24h: number | null;
  sourceNote?: string;
  symbol: string;
  updatedAt: string;
  volume24h: number;
}): MarketData {
  const base = exampleData[symbol] ?? estimateDemoMetrics(symbol);

  return {
    ...base,
    baseAsset,
    symbol,
    quoteAsset,
    price,
    change24h,
    change24hText: change24h.toFixed(2),
    volume24h,
    quoteVolume24h,
    quoteVolumeEstimated: false,
    volumeChange: estimateVolumeChange(quoteVolume24h),
    source: "api",
    dataSource,
    sourceNote,
    updatedAt
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

function estimateVolumeChange(quoteVolume24h: number | null) {
  if (quoteVolume24h === null) return 36;
  if (quoteVolume24h >= 500000000) return 86;
  if (quoteVolume24h >= 100000000) return 58;
  if (quoteVolume24h >= 10000000) return 36;
  return 18;
}

export class InvalidSymbolError extends Error {}
export class IncompleteMarketDataError extends Error {}
