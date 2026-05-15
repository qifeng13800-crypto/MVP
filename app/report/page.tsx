import { ReportView } from "@/components/ReportView";
import { createRiskReportFromMarketData } from "@/lib/risk";
import { normalizeSymbol } from "@/lib/marketData";
import type { MarketData, RiskReport } from "@/lib/types";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReportPageProps = {
  searchParams: {
    symbol?: string;
  };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const report = await createReportFromMarketApi(searchParams.symbol ?? "BTCUSDT");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <ReportView report={report} showBackLink />
    </main>
  );
}

async function createReportFromMarketApi(symbolInput: string): Promise<RiskReport> {
  const symbol = normalizeSymbol(symbolInput);
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : "";
  const response = await fetch(`${baseUrl}/api/market?symbol=${encodeURIComponent(symbol)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return createErrorReport(symbol, body.error ?? "暂时无法获取该交易对的公开行情数据，请稍后刷新或更换交易对。");
  }

  const data = (await response.json()) as MarketData;
  return createRiskReportFromMarketData(data);
}

function createErrorReport(symbol: string, error: string): RiskReport {
  return {
    data: {
      baseAsset: symbol.endsWith("USDT") ? symbol.slice(0, -4) : symbol,
      symbol,
      quoteAsset: symbol.endsWith("USDT") ? "USDT" : "",
      price: 0,
      change24h: null,
      change24hText: null,
      volume24h: 0,
      quoteVolume24h: 0,
      quoteVolumeEstimated: false,
      volumeChange: 0,
      fundingRate: 0,
      openInterestChange: 0,
      volatility: 0,
      updatedAt: new Date().toISOString(),
      source: "example",
      dataSource: "示例报告数据"
    },
    evaluation: {
      level: "low",
      reason: error,
      explainList: [error],
      checklist: ["请检查交易对拼写是否正确，或稍后刷新页面。"]
    },
    error
  };
}
