import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "开单前风险检查工具",
  description: "公开数据复盘、风险提示与新手开单前自查工具"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071014"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
