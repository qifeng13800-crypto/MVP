import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  help,
  icon: Icon
}: {
  label: string;
  value: string;
  help: string;
  icon: LucideIcon;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface/85 p-4 shadow-softGlow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-aqua/35 bg-aqua/10 text-aqua">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{help}</p>
    </section>
  );
}
