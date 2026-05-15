# 开单前风险检查工具

一个可运行的 MVP 网页项目，用于公开数据复盘、风险提示和新手开单前自查。当前版本会优先读取公开行情数据，不连接真实交易账户。

## 项目结构

```text
app/
  api/risk/route.ts      Next.js API 路由，返回风险检查报告
  beta/page.tsx          内测说明页
  examples/page.tsx      示例报告页
  globals.css            全局样式和深色背景
  layout.tsx             全站布局、元信息、固定免责声明
  page.tsx               首页输入与卖点展示
  report/page.tsx        风险报告页
components/
  CopyReportButton.tsx   复制报告按钮
  ExampleCard.tsx        示例报告卡片
  MetricCard.tsx         数据指标卡片
  ReportView.tsx         风险报告主体
  RiskBadge.tsx          风险等级标签
  SiteShell.tsx          顶部导航和底部免责声明
lib/
  marketData.ts          公开行情数据入口与示例数据兜底
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
MEMEUSDT
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

真实公开行情字段来自 Binance Spot 公开只读接口：

```text
GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
```

当前使用接口字段：

- `lastPrice`：当前价格
- `priceChangePercent`：24 小时涨跌幅
- `volume`：24 小时成交量

以下字段当前仍为演示算法估算：

- 资金费率
- 持仓变化
- 短周期波动强度

这些估算指标会在页面上标注：“该指标为演示算法估算，后续接入更多公开数据。”

## API 失败时如何处理

- 如果 Binance 公共行情接口请求成功，报告会显示：“数据来源：公开行情数据，可能存在延迟。”
- 如果真实报告页的行情接口请求失败，页面会显示：“行情接口请求失败，请稍后刷新”。
- 如果交易对不存在，页面会提示：“暂未找到该交易对，请检查输入是否正确。”
- 真实报告页不会使用示例价格兜底。
- 示例数据只用于“示例报告页”。

## 后续如何接入更多公开数据源

数据入口在 `lib/marketData.ts`。

后续可以在保持 `MarketData` 类型不变的前提下继续补充：

- Binance Futures 公共资金费率接口
- Binance Futures 公共持仓量接口
- 多周期 K 线公开数据
- 更多公开数据源的备用行情接口

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
