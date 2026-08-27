import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GRID — SEO / GEO Research System",
  description: "SEO / GEO Research System — simulations, functions, the grid",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex flex-col h-screen bg-[#050508] text-[#cff5ff]">
        <TopNav />
        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      </body>
    </html>
  );
}
