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
npx prisma migrate dev
npm run db:seed   # optional: adds a sample buyer + deals in every stage
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, with Prisma + SQLite
(via the `@prisma/adapter-better-sqlite3` driver adapter) for persistence.
