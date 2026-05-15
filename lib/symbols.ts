const BINANCE_EXCHANGE_INFO_URL = "https://data-api.binance.vision/api/v3/exchangeInfo";
const OKX_INSTRUMENTS_URL = "https://www.okx.com/api/v5/public/instruments?instType=SPOT";
const MEXC_EXCHANGE_INFO_URL = "https://api.mexc.com/api/v3/exchangeInfo";
const SYMBOL_CACHE_MS = 10 * 60 * 1000;
const QUOTES = ["USDT", "USDC", "FDUSD", "BTC", "ETH"];

type SymbolSource = "binance" | "okx" | "mexc";

type SymbolRegistry = Record<SymbolSource, Set<string>>;

type CachedRegistry = {
  expiresAt: number;
  registry: SymbolRegistry;
};

type BinanceExchangeInfo = {
  symbols?: Array<{
    symbol?: string;
    status?: string;
  }>;
};

type OkxInstruments = {
  data?: Array<{
    instId?: string;
    state?: string;
  }>;
};

type MexcExchangeInfo = {
  symbols?: Array<{
    symbol?: string;
    status?: string;
  }>;
};

let cachedRegistry: CachedRegistry | undefined;

export type ResolvedSymbol = {
  baseAsset: string;
  input: string;
  normalized: string;
  quoteAsset: string;
};

export function resolveSymbol(input: string): ResolvedSymbol {
  const cleaned = input.trim().toUpperCase().replace(/[\s\-/]+/g, "").replace(/[^A-Z0-9]/g, "");
  const normalizedInput = cleaned || "BTC";
  const quoteAsset = QUOTES.find((quote) => normalizedInput.endsWith(quote) && normalizedInput.length > quote.length);

  if (quoteAsset) {
    return {
      baseAsset: normalizedInput.slice(0, -quoteAsset.length),
      input,
      normalized: normalizedInput,
      quoteAsset
    };
  }

  return {
    baseAsset: normalizedInput,
    input,
    normalized: `${normalizedInput}USDT`,
    quoteAsset: "USDT"
  };
}

export async function getSymbolRegistry(): Promise<SymbolRegistry> {
  if (cachedRegistry && cachedRegistry.expiresAt > Date.now()) {
    return cachedRegistry.registry;
  }

  const [binance, okx, mexc] = await Promise.all([
    fetchBinanceSymbols(),
    fetchOkxSymbols(),
    fetchMexcSymbols()
  ]);
  const registry = { binance, okx, mexc };

  cachedRegistry = {
    expiresAt: Date.now() + SYMBOL_CACHE_MS,
    registry
  };

  return registry;
}

export function findSymbolSources(symbol: string, registry: SymbolRegistry): SymbolSource[] {
  return (["binance", "okx", "mexc"] as SymbolSource[]).filter((source) => registry[source].has(symbol));
}

export function findSimilarSymbols(resolved: ResolvedSymbol, registry: SymbolRegistry, limit = 6): string[] {
  const allSymbols = new Set<string>();
  for (const source of Object.values(registry)) {
    for (const symbol of source) {
      allSymbols.add(symbol);
    }
  }

  return [...allSymbols]
    .filter((symbol) => symbol.startsWith(resolved.baseAsset))
    .sort((a, b) => scoreSuggestion(a, resolved) - scoreSuggestion(b, resolved))
    .slice(0, limit);
}

export function toOkxInstId(symbol: string) {
  const resolved = resolveSymbol(symbol);
  return `${resolved.baseAsset}-${resolved.quoteAsset}`;
}

async function fetchBinanceSymbols() {
  try {
    const response = await fetch(BINANCE_EXCHANGE_INFO_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) return new Set<string>();

    const payload = (await response.json()) as BinanceExchangeInfo;
    return new Set(
      (payload.symbols ?? [])
        .filter((item) => item.symbol && (!item.status || item.status === "TRADING"))
        .map((item) => item.symbol as string)
    );
  } catch {
    return new Set<string>();
  }
}

async function fetchOkxSymbols() {
  try {
    const response = await fetch(OKX_INSTRUMENTS_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) return new Set<string>();

    const payload = (await response.json()) as OkxInstruments;
    return new Set(
      (payload.data ?? [])
        .filter((item) => item.instId && (!item.state || item.state === "live"))
        .map((item) => (item.instId as string).replace("-", ""))
    );
  } catch {
    return new Set<string>();
  }
}

async function fetchMexcSymbols() {
  try {
    const response = await fetch(MEXC_EXCHANGE_INFO_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) return new Set<string>();

    const payload = (await response.json()) as MexcExchangeInfo;
    return new Set(
      (payload.symbols ?? [])
        .filter((item) => item.symbol && (!item.status || item.status === "1" || item.status === "ENABLED"))
        .map((item) => item.symbol as string)
    );
  } catch {
    return new Set<string>();
  }
}

function scoreSuggestion(symbol: string, resolved: ResolvedSymbol) {
  if (symbol === `${resolved.baseAsset}USDT`) return 0;
  if (symbol === `${resolved.baseAsset}USDC`) return 1;
  if (symbol === `${resolved.baseAsset}FDUSD`) return 2;
  if (symbol.endsWith("USDT")) return 3;
  return 4;
}
