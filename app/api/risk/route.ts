import { NextRequest, NextResponse } from "next/server";
import { createRiskReport } from "@/lib/risk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT";

  return NextResponse.json(await createRiskReport(symbol));
}
