import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Financial Health Snapshot",
  description:
    "Your finances at a glance — no judgment, just clarity. Ballpark your holdings, debts, and expenses to get encouraging, actionable insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"
          strategy="lazyOnload"
        />
        <Script id="kofi-init" strategy="lazyOnload">
          {`kofiwidget2.init('Support me on Ko-fi', '#72a4f2', 'R6R11VMSML');kofiwidget2.draw();`}
        </Script>
      </body>
    </html>
  );
}
