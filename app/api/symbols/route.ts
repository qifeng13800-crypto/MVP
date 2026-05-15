import { NextRequest, NextResponse } from "next/server";
import { findSimilarSymbols, findSymbolSources, getSymbolRegistry, resolveSymbol } from "@/lib/symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("symbol") ?? "";
  const resolved = resolveSymbol(input);
  const registry = await getSymbolRegistry();
  const sources = findSymbolSources(resolved.normalized, registry);
  const suggestions = findSimilarSymbols(resolved, registry);

  return NextResponse.json({
    exists: sources.length > 0,
    normalized: resolved.normalized,
    quoteAsset: resolved.quoteAsset,
    sources,
    suggestions
  }, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=300"
    }
  });
}
