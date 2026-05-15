import type { RiskLevel } from "@/lib/types";

const labelMap: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

const styleMap: Record<RiskLevel, string> = {
  low: "border-aqua/50 bg-aqua/10 text-aqua",
  medium: "border-gold/55 bg-gold/10 text-gold",
  high: "border-coral/55 bg-coral/10 text-coral"
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex min-w-28 justify-center rounded-md border px-4 py-3 text-xl font-semibold shadow-softGlow sm:text-2xl ${styleMap[level]}`}>
      {labelMap[level]}
    </span>
  );
}
