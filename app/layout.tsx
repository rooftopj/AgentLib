import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BookOpen, Boxes, FolderGit2, Network } from "lucide-react";
import AmbientNoise from "@/components/AmbientNoise";
import SearchDialog from "@/components/SearchDialog";
import TopicMenu from "@/components/TopicMenu";
import { publicPath } from "@/lib/public-path";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Lib",
  description: "面向中文读者的 Agent 学习资料库，提供论文讲解、博客洞察与开源项目分析。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/agent-paper-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AmbientNoise />
        <header className="site-header">
          <Link href="/" className="brand" aria-label="返回首页">
            <img className="brand-mark" src={publicPath("/agent-paper-logo.png")} alt="" aria-hidden="true" />
            <span>
              <strong>Agent Lib</strong>
            </span>
          </Link>
          <nav className="site-nav" aria-label="主导航">
            <Link className="nav-link" href="/atlas/"><Network size={16} aria-hidden="true" />知识图谱</Link>
            <TopicMenu />
            <Link className="nav-link" href="/papers/"><BookOpen size={16} aria-hidden="true" />论文库</Link>
            <Link className="nav-link" href="/blogs/"><Boxes size={16} aria-hidden="true" />博客</Link>
            <Link className="nav-link" href="/projects/"><FolderGit2 size={16} aria-hidden="true" />开源项目</Link>
            <SearchDialog />
          </nav>
        </header>
        <main>{children}</main>
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"21b8544c2cbd452f89f14a9ac6363c0a"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
