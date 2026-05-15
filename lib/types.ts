export type RiskLevel = "low" | "medium" | "high";

export type MarketData = {
  symbol: string;
  price: number;
  change24h: number | null;
  change24hText: string | null;
  volume24h: number;
  volumeChange: number;
  fundingRate: number;
  openInterestChange: number;
  volatility: number;
  updatedAt: string;
  source: "api" | "fallback";
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
