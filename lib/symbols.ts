const BINANCE_FUTURES_EXCHANGE_INFO_URL = "https://fapi.binance.com/fapi/v1/exchangeInfo";
const SYMBOL_CACHE_MS = 10 * 60 * 1000;
const QUOTES = ["USDT", "USDC", "FDUSD", "BTC", "ETH"];

type SymbolSource = "binance-futures";

type SymbolRegistry = Record<SymbolSource, Set<string>>;

type CachedRegistry = {
  expiresAt: number;
  registry: SymbolRegistry;
};

type BinanceFuturesExchangeInfo = {
  symbols?: Array<{
    contractType?: string;
    quoteAsset?: string;
    status?: string;
    symbol?: string;
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

  const registry = {
    "binance-futures": await fetchBinanceFuturesSymbols()
  };

  cachedRegistry = {
    expiresAt: Date.now() + SYMBOL_CACHE_MS,
    registry
  };

  return registry;
}

export function findSymbolSources(symbol: string, registry: SymbolRegistry): SymbolSource[] {
  return (["binance-futures"] as SymbolSource[]).filter((source) => registry[source].has(symbol));
}

export function findSimilarSymbols(resolved: ResolvedSymbol, registry: SymbolRegistry, limit = 6): string[] {
  return [...registry["binance-futures"]]
    .filter((symbol) => symbol.startsWith(resolved.baseAsset))
    .sort((a, b) => scoreSuggestion(a, resolved) - scoreSuggestion(b, resolved))
    .slice(0, limit);
}

async function fetchBinanceFuturesSymbols() {
  try {
    const response = await fetch(BINANCE_FUTURES_EXCHANGE_INFO_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) return new Set<string>();

    const payload = (await response.json()) as BinanceFuturesExchangeInfo;
    return new Set(
      (payload.symbols ?? [])
        .filter((item) => item.symbol && item.status === "TRADING" && item.contractType === "PERPETUAL" && item.quoteAsset === "USDT")
        .map((item) => item.symbol as string)
    );
  } catch {
    return new Set<string>();
  }
}

function scoreSuggestion(symbol: string, resolved: ResolvedSymbol) {
  if (symbol === `${resolved.baseAsset}USDT`) return 0;
  if (symbol.endsWith("USDT")) return 1;
  return 2;
}
