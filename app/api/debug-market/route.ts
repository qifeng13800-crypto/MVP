import { NextRequest, NextResponse } from "next/server";
import { getMarketDebug } from "@/lib/marketData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT";
  const debug = await getMarketDebug(symbol);

  return NextResponse.json(debug, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
