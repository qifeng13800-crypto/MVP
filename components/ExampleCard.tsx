import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import type { RiskReport } from "@/lib/types";

export function ExampleCard({ report }: { report: RiskReport }) {
  const { data, evaluation } = report;

  return (
    <section className="rounded-lg border border-border bg-surface/85 p-5 shadow-softGlow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">示例交易对</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{data.symbol}</h2>
        </div>
        <RiskBadge level={evaluation.level} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border bg-bg/70 p-3">
          <p className="text-slate-400">24小时成交量</p>
          <p className="mt-1 font-semibold text-white">{formatVolume(data.volume24h)}</p>
        </div>
        <div className="rounded-md border border-border bg-bg/70 p-3">
          <p className="text-slate-400">波动强度</p>
          <p className="mt-1 font-semibold text-white">{data.volatility.toFixed(1)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{evaluation.reason}</p>
      <Link href={`/report?symbol=${data.symbol}`} className="mt-5 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-slate-200 hover:border-aqua">
        查看完整报告
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function formatVolume(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}
