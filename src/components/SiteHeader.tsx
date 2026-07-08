"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
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
          <form action={logout} className="ml-2">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
