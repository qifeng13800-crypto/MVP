export type RiskLevel = "low" | "medium" | "high";

export type MarketData = {
  baseAsset: string;
  symbol: string;
  quoteAsset: string;
  price: number;
  change24h: number | null;
  change24hText: string | null;
  volume24h: number;
  quoteVolume24h: number;
  quoteVolumeEstimated?: boolean;
  volumeChange: number;
  fundingRate: number;
  openInterestChange: number;
  volatility: number;
  updatedAt: string;
  source: "api" | "example";
  dataSource: "Binance U 本位合约公开行情" | "示例报告数据";
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
