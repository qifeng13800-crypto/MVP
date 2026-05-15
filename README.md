# 开单前风险检查工具

一个可运行的 MVP 网页项目，用于公开数据复盘、风险提示和新手开单前自查。当前版本会优先读取公开行情数据，不连接真实交易账户。

## 项目结构

```text
app/
  api/risk/route.ts      Next.js API 路由，返回风险检查报告
  beta/page.tsx          内测说明页
  globals.css            全局样式和深色背景
  layout.tsx             全站布局、元信息、固定免责声明
  page.tsx               首页输入与卖点展示
  report/page.tsx        风险报告页
components/
  CopyReportButton.tsx   复制报告按钮
  MetricCard.tsx         数据指标卡片
  ReportView.tsx         风险报告主体
  RiskBadge.tsx          风险等级标签
  SiteShell.tsx          顶部导航和底部免责声明
lib/
  marketData.ts          合约公开行情数据入口
  reportText.ts          分享文案与提醒文案生成
  risk.ts                风险等级规则和白话解释
  types.ts               TypeScript 类型
scripts/
  check-copy.js          文案风险词检查脚本
netlify.toml             Netlify 部署配置
```

## 本地运行方法

首次运行：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

可测试输入：

```text
BTCUSDT
ETHUSDT
SOLUSDT
DOGEUSDT
SKYAIUSDT
```

## 打包方法

```bash
npm run build
```

本地预览生产版本：

```bash
npm run start
```

## 当前数据来源

真实报告页默认只查询 Binance U 本位合约公开行情，不会在后台自动切换到其他平台。

用户在报告页手动选择其他数据市场后，才会查询：

- OKX 永续合约
- MEXC 合约行情

默认接口：

```text
GET https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT
```

Binance U本位合约字段：

- `lastPrice`：当前价格
- `priceChangePercent`：24 小时涨跌幅
- `volume`：24 小时成交量
- `quoteVolume`：24 小时成交额
- `closeTime`：数据时间

OKX 永续合约字段：

- `last`：当前价格
- `open24h`：24 小时前价格，用于计算 24 小时涨跌幅
- `volCcy24h`：24 小时成交量
- `volCcyQuote24h`：24 小时成交额。如果接口未返回，页面会显示“该数据源未返回成交额”。
- `ts`：数据时间

MEXC 合约行情字段：

- `lastPrice`：当前价格
- `riseFallRate`：24 小时涨跌幅
- `volume24`：24 小时成交量
- `amount24`：24 小时成交额
- `timestamp`：数据时间

项目还提供 `/api/symbols?symbol=BTCUSDT`，用于查询 Binance U本位合约交易对是否存在和相近交易对建议。交易对列表在服务端缓存约 10 分钟。

真实报告页不会使用示例价格、随机价格或旧数据兜底。

调试接口：

```text
GET /api/debug-market?symbol=SKYAIUSDT
```

该接口用于排查数据源请求情况，会返回 Binance Futures 原始字段、OKX 请求状态、MEXC 请求状态和当前最终使用的数据源。

## API 失败时如何处理

- 如果 Binance U 本位合约请求成功，报告会显示：“数据市场：Binance U 本位合约”。
- 如果 Binance 请求失败，页面会显示：“暂时无法获取 Binance U 本位合约公开行情，请稍后刷新。”
- 页面不会自动用 OKX 或 MEXC 数据替代 Binance 数据。
- 用户手动选择 OKX 或 MEXC 后，页面会标注：“当前数据不是 Binance 合约数据，可能与 Binance 页面存在差异。”
- 如果交易对不存在，页面会提示：“暂未找到该交易对，请检查输入是否正确。”
- 真实报告页不会使用示例价格兜底。
- 真实查询只展示合约公开行情，不生成假报告。

## 后续如何接入更多公开数据源

数据入口在 `lib/marketData.ts`。

后续可以在保持 `MarketData` 类型不变的前提下继续补充：

- Binance Futures 公共资金费率接口
- Binance Futures 公共持仓量接口
- 多周期 K 线公开数据
- 更多合约公开行情接口

只要返回结构仍然符合 `MarketData`，`lib/risk.ts` 和页面组件就可以继续复用。

## Vercel 部署方法

1. 把项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，选择 `Add New Project`。
3. 导入这个仓库。
4. Framework Preset 选择 `Next.js`。
5. Build Command 使用默认值：

```bash
npm run build
```

6. Install Command 使用默认值：

```bash
npm install
```

7. 点击 Deploy。

当前项目不需要配置环境变量。

## Netlify 部署方法

当前项目可以部署到 Netlify。项目已经包含 `netlify.toml`，Netlify 导入仓库后会读取以下配置：

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

如果 Netlify 页面要求手动填写：

- Build command：`npm run build`
- Publish directory：`.next`

部署步骤：

1. 登录 Netlify。
2. 选择 `Add new site`。
3. 选择 `Import an existing project`。
4. 选择 GitHub，并授权 Netlify 读取仓库。
5. 选择这个项目仓库。
6. Build command 填 `npm run build`。
7. Publish directory 填 `.next`。
8. 环境变量保持为空。
9. 点击 `Deploy`。

部署完成后，在 Netlify 的站点页面中复制以 `netlify.app` 结尾的网址即可访问。

## 测试方式

```bash
npm run test
```

测试会执行：

- `next lint`
- `next build`
- 页面与核心代码的文案风险词检查

## 合规注意事项

- 工具只做公开数据整理、学习复盘和风险提醒。
- 不连接真实交易账户。
- 不展示具体交易动作按钮。
- 不承诺收益。
- 不预测涨跌。
- 不构成投资建议。
