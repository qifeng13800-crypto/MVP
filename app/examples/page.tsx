import { ExampleCard } from "@/components/ExampleCard";
import { createRiskReport } from "@/lib/risk";

const examples = ["BTCUSDT", "ETHUSDT", "MEMEUSDT"];

export default async function ExamplesPage() {
  const reports = await Promise.all(examples.map((symbol) => createRiskReport(symbol)));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-aqua">示例报告</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">三种常见风险状态</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          示例预置 BTCUSDT、ETHUSDT、MEMEUSDT，方便截图、演示和内测反馈。
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <ExampleCard key={report.data.symbol} report={report} />
        ))}
      </div>
    </main>
  );
}
