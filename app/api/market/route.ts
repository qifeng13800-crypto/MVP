import { NextRequest, NextResponse } from "next/server";
import { getMarketData } from "@/lib/marketData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT";
  const result = await getMarketData(symbol);

  if (!result.data) {
    const status = result.error === "暂未找到该交易对，请检查输入是否正确。" ? 404 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ...result.data,
    lastPrice: result.data.price,
    priceChangePercent: result.data.change24hText,
    volume: result.data.volume24h,
    quoteVolume: result.data.quoteVolume24h,
    closeTime: new Date(result.data.updatedAt).getTime(),
    dataSource: result.data.dataSource,
    sourceNote: result.data.sourceNote
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
