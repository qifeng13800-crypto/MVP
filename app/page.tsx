"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, ClipboardCheck, Gauge, ShieldCheck } from "lucide-react";

const quickSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

export default function HomePage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("BTCUSDT");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized) {
      router.push(`/report?symbol=${normalized}`);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <section className="grid min-h-[calc(100vh-10rem)] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-lg border border-border bg-surface/80 p-5 shadow-softGlow sm:p-8">
          <div className="screen-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-aqua/35 bg-aqua/10 px-3 py-1 text-sm text-aqua">
              <ShieldCheck size={16} />
              新手开单前自查
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              开单前风险检查工具
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              只做公开数据复盘和风险提示，不构成投资建议
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white">
              输入交易对，生成一份开单前风险检查报告。
            </p>

            <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-border bg-bg/80 p-3">
              <label htmlFor="symbol" className="mb-2 block text-sm text-slate-300">
                输入交易对，例如 BTCUSDT、ETHUSDT、SOLUSDT
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="symbol"
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  placeholder="BTCUSDT"
                  className="min-h-12 flex-1 rounded-md border border-border bg-surface2 px-4 text-lg font-semibold uppercase text-white outline-none transition focus:border-aqua"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-aqua px-5 font-semibold text-bg transition hover:bg-[#7df0d7]"
                >
                  生成风险检查报告
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {quickSymbols.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setSymbol(item)}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-slate-200 transition hover:border-aqua hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </form>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/beta"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-slate-200 transition hover:border-aqua hover:text-white"
              >
                <ShieldCheck size={17} />
                查看内测说明
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            { title: "公开数据整理", text: "把价格、成交量、资金费率、持仓变化放在一张报告里。", icon: BarChart3 },
            { title: "风险等级提示", text: "用低、中、高三个等级提醒当前波动环境。", icon: Gauge },
            { title: "开单前自查清单", text: "先检查情绪、仓位、计划和复盘记录，再做下一步。", icon: ClipboardCheck }
          ].map(({ title, text, icon: Icon }) => (
            <section key={title} className="rounded-lg border border-border bg-surface/85 p-5 shadow-softGlow">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-aqua/10 text-aqua">
                <Icon size={22} />
              </div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
