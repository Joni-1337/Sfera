import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { TawkWidget } from "@/components/support/TawkWidget";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = rootMetadata;
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
        <TawkWidget />
      </body>
    </html>
  );
}
