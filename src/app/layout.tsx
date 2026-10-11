import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
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
  title: "Wholesale Pipeline",
  description: "Track government-seized property deals from source to close.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 print:max-w-none print:p-0">
          {children}
        </main>
        <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500 print:hidden">
          Sourced → Filtered → Under Contract → Marketed → Closed
        </footer>
      </body>
    </html>
  );
}
