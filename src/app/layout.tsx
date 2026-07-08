import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="border-b border-neutral-800 bg-neutral-900/60 print:hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Wholesale Pipeline
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Pipeline
              </Link>
              <Link
                href="/buyers"
                className="px-3 py-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cash Buyers
              </Link>
              <Link
                href="/deals/new"
                className="ml-2 px-3 py-1.5 rounded-md bg-emerald-500 text-neutral-950 font-medium hover:bg-emerald-400 transition-colors"
              >
                + New Deal
              </Link>
            </nav>
          </div>
        </header>
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
