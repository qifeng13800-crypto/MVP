import { ReportView } from "@/components/ReportView";
import { createRiskReport } from "@/lib/risk";

type ReportPageProps = {
  searchParams: {
    symbol?: string;
  };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const report = await createRiskReport(searchParams.symbol ?? "BTCUSDT");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <ReportView report={report} showBackLink />
    </main>
  );
}
