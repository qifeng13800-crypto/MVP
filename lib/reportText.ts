import type { RiskLevel, RiskReport } from "@/lib/types";

export function levelText(level: RiskLevel) {
  return {
    low: "低风险",
    medium: "中风险",
    high: "高风险"
  }[level];
}

export function getRiskReminders(report: RiskReport) {
  const { data, evaluation } = report;
  const reminders: string[] = [];

  if (data.volatility >= 5) {
    reminders.push("当前波动偏大");
  } else {
    reminders.push("当前波动相对温和");
  }

  if (data.volumeChange >= 30) {
    reminders.push("成交量变化明显");
  } else {
    reminders.push("成交量变化不算突出");
  }

  if (evaluation.level === "high") {
    reminders.push("建议先完成情绪自查和风险检查");
  } else {
    reminders.push("建议开单前重新检查自己的交易理由");
  }

  return reminders.slice(0, 3);
}

export function buildReportCopy({
  report,
  riskInterpretation,
  summary
}: {
  report: RiskReport;
  riskInterpretation: string;
  summary: string;
}) {
  return [
    `【交易对】${report.data.symbol}`,
    `【数据市场】${formatDataMarket(report.data.dataSource)}`,
    `【当前价格】$${formatPrice(report.data.price)}`,
    `【24小时涨跌幅】${formatPercentText(report.data.change24hText)}`,
    `【24小时成交量】${formatVolume(report.data.volume24h)} ${report.data.baseAsset}`,
    `【24小时成交额】${formatQuoteVolume(report.data.quoteVolume24h, report.data.quoteAsset)}`,
    `【风险等级】${levelText(report.evaluation.level)}`,
    `【一句话总结】${summary}`,
    "",
    "【风险提醒】",
    riskInterpretation,
    "",
    "说明：本报告仅作公开数据复盘和风险提醒，不提供具体操作建议，不构成投资建议。"
  ].join("\n");
}

function formatPercentText(value: string | null) {
  if (value === null) return "暂无数据";
  return `${Number(value) > 0 ? "+" : ""}${value}%`;
}

function formatVolume(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function formatQuoteVolume(value: number | null, quoteAsset: string) {
  if (value === null) return "该数据源未返回成交额";
  return `${formatVolume(value)} ${quoteAsset}`;
}

function formatDataMarket(dataSource: string) {
  if (dataSource === "Binance U本位合约") return "Binance U本位合约";
  if (dataSource === "OKX 永续合约") return "OKX 永续合约";
  if (dataSource === "MEXC 合约行情") return "MEXC 合约行情";
  return dataSource;
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
