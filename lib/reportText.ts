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

export function buildReportCopy(report: RiskReport) {
  const reminders = getRiskReminders(report);

  return [
    `【交易对】${report.data.symbol}`,
    `【风险等级】${levelText(report.evaluation.level)}`,
    `【数据来源】${report.data.dataSource}`,
    "【真实公开行情数据】",
    `当前价格：$${formatPrice(report.data.price)}`,
    `24小时涨跌幅：${formatPercentText(report.data.change24hText)}`,
    `24小时成交量：${formatVolume(report.data.volume24h)}`,
    "【演示算法估算】",
    `资金费率：${report.data.fundingRate.toFixed(3)}%`,
    `持仓变化：${formatSignedPercent(report.data.openInterestChange)}`,
    `短周期波动强度：${report.data.volatility.toFixed(1)}`,
    "【主要提醒】",
    ...reminders.map((item, index) => `${index + 1}. ${item}`),
    "",
    "说明：本内容仅作公开数据复盘和风险提醒，不构成投资建议。"
  ].join("\n");
}

function formatPercentText(value: string | null) {
  if (value === null) return "暂无数据";
  return `${Number(value) > 0 ? "+" : ""}${value}%`;
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatVolume(value: number) {
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
