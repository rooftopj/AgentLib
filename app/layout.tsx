import type { Metadata } from "next";
import Link from "next/link";
import SearchDialog from "@/components/SearchDialog";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Lib",
  description: "面向中文读者的 Agent 学习资料库，当前提供论文讲解与中英对照精读。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="返回首页">
            <img className="brand-mark" src="/agent-paper-logo.png" alt="" aria-hidden="true" />
            <span>
              <strong>Agent Lib</strong>
            </span>
          </Link>
          <nav className="site-nav" aria-label="主导航">
            <Link href="/papers/">论文库</Link>
            <SearchDialog />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
