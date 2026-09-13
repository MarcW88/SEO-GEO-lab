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
  title: "SEO / GEO Lab — SEO Tools Hub",
  description: "Laboratoire de recherche SEO et GEO — expériences, capacités et outils.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex flex-col h-screen bg-[#0B0D12] text-[#E9EAF2]">
        <TopNav />
        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      </body>
    </html>
  );
}
