# Wholesale Pipeline

A deal-tracking CRM for wholesaling government-seized properties: source deals,
filter for the spread, lock them under an assignable contract, market to cash
buyers, and track them through closing.

## Workflow

1. **Source** — log deals found on USMarshals.gov, GSAAuctions.gov, Treasury.gov,
   or HUD Home Store.
2. **Filter** — the app flags deals with a purchase price of $2K–$10K and an
   estimated value of $50K+.
3. **Lock it under contract** — record earnest money and inspection period, and
   generate the "Buyer: [Your Name] and/or Assigns" assignable-offer clause.
4. **Find a cash buyer** — assign a buyer from your list, set an assignment
   fee, and generate a ready-to-post marketing blurb for investor Facebook
   groups, BiggerPockets Marketplace, or Meetup networks.
5. **Close and collect** — mark the deal closed once the title company sends
   your assignment-fee check.

## Getting started

```bash
npm install
cp .env.example .env
# then edit .env and set APP_PASSWORD and SESSION_SECRET (see below)
npx prisma migrate dev
npm run db:seed   # optional: adds sample buyers + deals in every stage
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Access

The whole app sits behind a single shared password — there are no separate
user accounts, matching a single-operator tool. Set two values in `.env`:

- `APP_PASSWORD` — the password prompted at `/login`.
- `SESSION_SECRET` — a random signing key for the session cookie. Generate
  one with `openssl rand -hex 32`.

If either is missing, every page redirects to a login form that can never
succeed — the app fails closed rather than silently running open.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, with Prisma + SQLite
(via the `@prisma/adapter-better-sqlite3` driver adapter) for persistence.
Access is gated by `src/proxy.ts` (Next's replacement for `middleware.ts`
in this version) checking a signed session cookie.
