import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
