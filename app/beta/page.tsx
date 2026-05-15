import { Beaker, BookOpenCheck, ClipboardList, Database, MessageSquareText, ShieldCheck } from "lucide-react";

const notes = [
  {
    title: "当前是 MVP 内测版",
    text: "第一版先验证报告结构、手机端展示、分享效果和新手是否看得懂。",
    icon: Beaker
  },
  {
    title: "公开行情数据整理",
    text: "优先读取公开行情接口，把价格、涨跌幅和成交量整理进报告。",
    icon: Database
  },
  {
    title: "开单前风险自查",
    text: "围绕波动、成交量、资金费率、持仓变化和风险等级做自查提醒。",
    icon: ClipboardList
  },
  {
    title: "交易情绪提醒",
    text: "帮助用户在开单前先检查情绪、计划、仓位和复盘记录。",
    icon: BookOpenCheck
  },
  {
    title: "边界清晰",
    text: "不提供具体点位、方向判断、收益承诺、账户托管执行或陪跑式下单服务。",
    icon: ShieldCheck
  },
  {
    title: "欢迎内测反馈",
    text: "可以反馈报告是否看得懂、风险提醒是否有帮助、还想增加什么公开数据。",
    icon: MessageSquareText
  }
];

export default function BetaPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col justify-center px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-aqua">内测说明</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">先做风险检查，再做情绪自查</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
        本工具面向刚接触高波动资产的新手，把公开行情数据、风险自查和学习记录整理成一份更容易看懂的报告。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {notes.map(({ title, text, icon: Icon }) => (
          <section key={title} className="rounded-lg border border-border bg-surface/85 p-5 shadow-softGlow">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-aqua/10 text-aqua">
              <Icon size={22} />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
          </section>
        ))}
      </div>

      <section className="mt-5 rounded-lg border border-border bg-surface/85 p-5">
        <h2 className="text-xl font-semibold text-white">边界说明</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          本工具仅作公开数据复盘和风险提醒，不构成投资建议。当前版本不连接真实交易账户，不提供具体点位或方向判断，不承诺收益，也不预测涨跌。
        </p>
      </section>
    </main>
  );
}
