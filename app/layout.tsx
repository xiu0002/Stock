import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "股票交易紀錄系統",
  description: "Next.js + Supabase stock trade journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="border-b border-[#25272d] bg-[#050608]/95 px-3 py-3 text-[#f5f5f0] sm:px-6 lg:px-10">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-base font-semibold tracking-normal text-[#f7f3e8]">
              Stock Journal
            </Link>
            <div className="grid grid-cols-3 gap-2 text-xs sm:flex sm:flex-wrap sm:text-sm">
              <Link
                href="/"
                className="flex min-h-10 items-center justify-center border border-[#333741] px-2 py-2 text-center text-[#d6d9df] transition hover:border-[#c8aa6e] hover:text-[#f7f3e8] sm:px-3"
              >
                一般交易
              </Link>
              <Link
                href="/dca"
                className="flex min-h-10 items-center justify-center border border-[#333741] px-2 py-2 text-center text-[#d6d9df] transition hover:border-[#c8aa6e] hover:text-[#f7f3e8] sm:px-3"
              >
                定期定額
              </Link>
              <Link
                href="/dividends"
                className="flex min-h-10 items-center justify-center border border-[#333741] px-2 py-2 text-center text-[#d6d9df] transition hover:border-[#c8aa6e] hover:text-[#f7f3e8] sm:px-3"
              >
                股息紀錄
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
