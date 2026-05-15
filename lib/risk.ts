import { getExampleMarketData, getMarketData } from "@/lib/marketData";
import type { MarketData, RiskEvaluation, RiskLevel, RiskReport } from "@/lib/types";

export async function createRiskReport(symbol: string): Promise<RiskReport> {
  const result = await getMarketData(symbol);

  if (!result.data) {
    return {
      data: {
        symbol: symbol.trim().toUpperCase() || "BTCUSDT",
        price: 0,
        change24h: null,
        change24hText: null,
        volume24h: 0,
        quoteVolume24h: 0,
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
        reason: result.error ?? "暂未找到该交易对，请检查输入是否正确。",
        explainList: [result.error ?? "暂未找到该交易对，请检查输入是否正确。"],
        checklist: ["请检查交易对拼写是否正确。"]
      },
      error: result.error
    };
  }

  return {
    data: result.data,
    evaluation: evaluateRisk(result.data)
  };
}

export function createRiskReportFromMarketData(data: MarketData): RiskReport {
  return {
    data,
    evaluation: evaluateRisk(data)
  };
}

export function createExampleRiskReport(symbol: string): RiskReport {
  const data = getExampleMarketData(symbol);

  return {
    data,
    evaluation: evaluateRisk(data)
  };
}

export function evaluateRisk(data: MarketData): RiskEvaluation {
  const level = getRiskLevel(data.volumeChange, data.volatility);

  return {
    level,
    reason: buildReason(level, data),
    explainList: buildExplainList(level, data),
    checklist: buildChecklist(level)
  };
}

function getRiskLevel(volumeChange: number, volatility: number): RiskLevel {
  if (volumeChange > 80 || volatility > 8) return "high";
  if ((volumeChange >= 30 && volumeChange <= 80) || (volatility >= 5 && volatility <= 8)) {
    return "medium";
  }
  return "low";
}

function buildReason(level: RiskLevel, data: MarketData) {
  if (level === "high") {
    return `当前24小时成交量为 ${formatVolume(data.volume24h)}，波动强度为 ${data.volatility.toFixed(1)}，至少有一项明显偏高。建议仅作为风险自查参考，不代表任何操作方向。`;
  }

  if (level === "medium") {
    return `当前24小时成交量对应的活跃度或波动强度处在中间区间，市场不算平静。建议仅作为风险自查参考，不代表任何操作方向。`;
  }

  return `当前24小时成交量对应的活跃度和波动强度都不高，风险提示偏低。建议仅作为风险自查参考，不代表任何操作方向。`;
}

function buildExplainList(level: RiskLevel, data: MarketData) {
  const list = [
    `24小时涨跌幅是 ${formatPercentText(data.change24hText)}，它只能说明过去一段时间变化，不代表下一步会怎么走。`,
    `24小时成交量是 ${formatVolume(data.volume24h)}，数值越大，说明短时间关注度可能更集中，情绪也可能更容易放大。`,
    `资金费率是 ${data.fundingRate.toFixed(3)}%，持仓变化是 ${formatPercent(data.openInterestChange)}，这两项当前为演示算法估算。`
  ];

  if (level === "high") {
    list.push("这份报告给出高风险，是因为24小时成交量对应的活跃度或波动强度已经越过警戒线，新手更容易被短线波动影响判断。");
  } else if (level === "medium") {
    list.push("这份报告给出中风险，是因为关键数据没有极端异常，但已经不算很平稳，需要认真做开单前检查。");
  } else {
    list.push("这份报告给出低风险，是因为24小时成交量对应的活跃度和波动强度都在较温和范围，但低风险不等于没有风险。");
  }

  return list;
}

function buildChecklist(level: RiskLevel) {
  const common = [
    "我是否写下了这次开单的理由？",
    "我是否知道自己最多能承受多少亏损？",
    "我是否检查了更高周期走势和近期公开信息？",
    "我是否确认当前不是被焦虑、兴奋或不甘心推动？",
    "我是否准备好把这次结果记录到学习记录里？"
  ];

  if (level === "high") {
    return [
      "当前波动偏强，我是否需要先观察一段时间？",
      "如果价格快速来回波动，我是否还能按原计划执行？",
      ...common
    ];
  }

  if (level === "medium") {
    return ["当前不是完全平静状态，我是否已经降低了冲动操作的可能？", ...common];
  }

  return common;
}

function formatPercent(value: number | null) {
  if (value === null) return "暂无数据";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
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
