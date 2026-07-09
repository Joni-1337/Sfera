import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_NAME, APP_TITLE, APP_DESCRIPTION } from "@/lib/branding";
import { JivoWidget } from "@/components/support/JivoWidget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <JivoWidget />
      </body>
    </html>
  );
}
