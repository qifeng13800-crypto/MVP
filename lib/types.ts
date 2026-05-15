export type RiskLevel = "low" | "medium" | "high";

export type MarketData = {
  symbol: string;
  price: number;
  change24h: number | null;
  change24hText: string | null;
  volume24h: number;
  quoteVolume24h: number;
  volumeChange: number;
  fundingRate: number;
  openInterestChange: number;
  volatility: number;
  updatedAt: string;
  source: "api" | "example";
  dataSource: "Binance 公共行情" | "OKX 公共行情" | "CoinGecko 聚合行情" | "示例报告数据";
  sourceNote?: string;
};

export type RiskEvaluation = {
  level: RiskLevel;
  reason: string;
  explainList: string[];
  checklist: string[];
};

export type RiskReport = {
  data: MarketData;
  evaluation: RiskEvaluation;
  error?: string;
};
