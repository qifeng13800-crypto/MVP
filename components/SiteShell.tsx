import Link from "next/link";
import { ShieldAlert } from "lucide-react";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/report?symbol=BTCUSDT", label: "风险报告" },
  { href: "/beta", label: "内测说明" }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-white">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-aqua text-bg">
              <ShieldAlert size={20} />
            </span>
            <span className="truncate">风险检查</span>
          </Link>
          <div className="flex gap-1 overflow-x-auto text-sm text-slate-300">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md px-3 py-2 transition hover:bg-surface2 hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {children}

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 py-3 text-center text-xs leading-5 text-slate-300 backdrop-blur sm:text-sm">
        <p>如果你正在参与内测，可以反馈：报告是否看得懂、风险提醒是否有帮助、还想增加什么数据。</p>
        <p className="mt-1 text-slate-400">本工具仅用于公开数据整理、学习复盘和风险提醒，不构成投资建议。</p>
      </footer>
    </div>
  );
}
