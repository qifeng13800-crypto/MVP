import Link from "next/link";
import { Activity, ArrowLeft, BarChart3, ClipboardCheck, Gauge, LineChart, Percent, RefreshCw, Sparkles, Waves } from "lucide-react";
import { CopyReportButton } from "@/components/CopyReportButton";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { getRiskReminders, levelText } from "@/lib/reportText";
import type { RiskReport } from "@/lib/types";

export function ReportView({
  report,
  showBackLink = false
}: {
  report: RiskReport;
  showBackLink?: boolean;
}) {
  const { data, evaluation } = report;
  const reminders = getRiskReminders(report);
  const publicDataHelp = data.source === "api" ? "来自公开行情接口，可能存在延迟。" : "示例数据，仅用于功能演示，非实时行情。";
  const estimatedDataHelp = "演示算法估算，后续接入更多公开数据。";
  const metricCards = [
    {
      label: "当前价格",
      value: `$${formatPrice(data.price)}`,
      help: publicDataHelp,
      icon: LineChart
    },
    {
      label: "24小时涨跌幅",
      value: formatPercentText(data.change24hText),
      help: publicDataHelp,
      icon: Percent
    },
    {
      label: "24小时成交量",
      value: formatVolume(data.volume24h),
      help: publicDataHelp,
      icon: BarChart3
    },
    {
      label: "资金费率",
      value: `${data.fundingRate.toFixed(3)}%`,
      help: estimatedDataHelp,
      icon: Gauge
    },
    {
      label: "持仓变化",
      value: formatPercent(data.openInterestChange),
      help: estimatedDataHelp,
      icon: Activity
    },
    {
      label: "短周期波动强度",
      value: data.volatility.toFixed(1),
      help: estimatedDataHelp,
      icon: Waves
    }
  ];

  if (report.error) {
    return (
      <div>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-aqua">风险检查报告</p>
            <h1 className="mt-2 break-words text-3xl font-semibold text-white sm:text-4xl">{data.symbol}</h1>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm text-slate-200 hover:border-aqua">
            <ArrowLeft size={17} />
            返回首页
          </Link>
        </div>
        <section className="rounded-lg border border-coral/50 bg-coral/10 p-5 text-coral shadow-softGlow">
          <h2 className="text-xl font-semibold">暂未找到该交易对</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">{report.error}</p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-aqua">风险检查报告</p>
          <h1 className="mt-2 break-words text-3xl font-semibold text-white sm:text-4xl">
            {data.symbol} 风险检查报告
          </h1>
          <p className="mt-2 text-base text-slate-300">开单前公开数据复盘与风险自查</p>
          <p className="mt-3 text-sm text-slate-400">数据更新时间：{formatDate(data.updatedAt)}</p>
          <p className="mt-2 text-sm text-slate-300">数据来源：{data.dataSource}</p>
          <p className={`mt-2 inline-flex rounded-md border px-3 py-2 text-xs leading-5 ${data.source === "api" ? "border-aqua/40 bg-aqua/10 text-aqua" : "border-gold/45 bg-gold/10 text-gold"}`}>
            {data.source === "api" ? "数据来源：公开行情数据，可能存在延迟。" : "示例数据，仅用于功能演示，非实时行情。"}
          </p>
          {data.sourceNote && (
            <p className="mt-2 rounded-md border border-gold/45 bg-gold/10 px-3 py-2 text-xs leading-5 text-gold">
              {data.sourceNote}
            </p>
          )}
          {data.source === "example" && (
            <p className="mt-2 rounded-md border border-gold/45 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
              当前为示例数据，非实时行情。
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <CopyReportButton report={report} />
          <Link href={`/report?symbol=${data.symbol}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-slate-200 hover:border-aqua">
            <RefreshCw size={17} />
            刷新数据
          </Link>
          <Link href="/examples" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-aqua/45 bg-aqua/10 px-4 text-sm font-semibold text-aqua hover:bg-aqua/15">
            <Sparkles size={17} />
            生成示例报告
          </Link>
          {showBackLink && (
            <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm text-slate-200 hover:border-aqua">
              <ArrowLeft size={17} />
              返回首页
            </Link>
          )}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-lg border border-aqua/45 bg-gradient-to-br from-surface via-surface to-bg p-5 shadow-softGlow sm:p-6">
        <div className="screen-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
          <p className="text-sm text-slate-400">综合风险等级</p>
            <div className="mt-3">
              <RiskBadge level={evaluation.level} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">{estimatedDataHelp}</p>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">{evaluation.reason}</p>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-surface/85 p-5">
        <h2 className="text-xl font-semibold text-white">数据概览</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-aqua/45 bg-bg/75 p-4 shadow-softGlow">
        <div className="mx-auto max-w-[390px] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-[#0f2027] via-surface to-bg p-5">
          <p className="text-sm font-medium text-aqua">适合截图的分享卡片</p>
          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">交易对</p>
              <h2 className="mt-1 break-words text-3xl font-semibold text-white">{data.symbol}</h2>
            </div>
            <span className="rounded-md border border-aqua/45 bg-aqua/10 px-3 py-2 text-base font-semibold text-aqua">
              {levelText(evaluation.level)}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {reminders.map((item, index) => (
              <div key={item} className="rounded-md border border-border bg-bg/70 p-3 text-sm leading-6 text-slate-200">
                {index + 1}. {item}
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-slate-400">
            本内容仅作公开数据复盘和风险提醒，不构成投资建议。
          </p>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-lg border border-border bg-surface/85 p-5">
          <h2 className="text-xl font-semibold text-white">风险解释</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {evaluation.explainList.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface/85 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <ClipboardCheck className="text-aqua" size={22} />
            开单前自查清单
          </h2>
          <div className="mt-4 space-y-3">
            {evaluation.checklist.map((item) => (
              <label key={item} className="flex gap-3 rounded-md border border-border bg-bg/70 p-3 text-sm leading-6 text-slate-200">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-aqua" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatPercent(value: number | null) {
  if (value === null) return "暂无数据";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatPercentText(value: string | null) {
  if (value === null) return "暂无数据";
  return `${Number(value) > 0 ? "+" : ""}${value}%`;
}

function formatVolume(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function formatPrice(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2
    });
  }

  if (value >= 1) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 4
    });
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
