import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DAY = 1000 * 60 * 60 * 24;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

async function main() {
  const buyer = await prisma.buyer.create({
    data: {
      name: "Marcus Reid",
      email: "marcus@reidcapital.com",
      phone: "555-201-8834",
      notes: "Buys single-family under $120K ARV in TX/OK, closes in 10 days, cash.",
    },
  });

  const sourced = await prisma.deal.create({
    data: {
      address: "412 Birchwood Ave",
      city: "Tulsa",
      state: "OK",
      zip: "74106",
      sourceSite: "GSAAuctions.gov",
      purchasePrice: 6500,
      estimatedValue: 78000,
      rentComp: 950,
      status: "SOURCED",
      notes: "Tax-defaulted single family, vacant 2 years. Needs full rehab.",
      createdAt: daysAgo(2),
    },
  });
  await prisma.dealActivity.create({
    data: {
      dealId: sourced.id,
      type: "CREATED",
      message: "Deal sourced from GSAAuctions.gov.",
      createdAt: daysAgo(2),
    },
  });

  const underContract = await prisma.deal.create({
    data: {
      address: "88 Route 9 Lot 4",
      city: "Hudson",
      state: "NY",
      zip: "12534",
      sourceSite: "USMarshals.gov",
      purchasePrice: 9200,
      estimatedValue: 61000,
      rentComp: 1100,
      status: "UNDER_CONTRACT",
      earnestMoney: 750,
      inspectionDays: 21,
      contractDate: daysAgo(3),
      notes: "Seized in forfeiture case. Title company: River Valley Title.",
      createdAt: daysAgo(6),
    },
  });
  await prisma.dealActivity.createMany({
    data: [
      {
        dealId: underContract.id,
        type: "CREATED",
        message: "Deal sourced from USMarshals.gov.",
        createdAt: daysAgo(6),
      },
      {
        dealId: underContract.id,
        type: "CONTRACT",
        message: "Locked under contract — earnest money and inspection terms saved.",
        createdAt: daysAgo(3),
      },
    ],
  });

  const marketing = await prisma.deal.create({
    data: {
      address: "2210 W 5th St",
      city: "Muskogee",
      state: "OK",
      zip: "74401",
      sourceSite: "HUD Home Store",
      purchasePrice: 4800,
      estimatedValue: 92000,
      rentComp: 1050,
      status: "MARKETING",
      earnestMoney: 500,
      inspectionDays: 14,
      contractDate: daysAgo(5),
      assignmentFee: 18000,
      buyerId: buyer.id,
      notes: "Posted to BiggerPockets Marketplace, 3 buyers interested.",
      createdAt: daysAgo(9),
    },
  });
  await prisma.dealActivity.createMany({
    data: [
      {
        dealId: marketing.id,
        type: "CREATED",
        message: "Deal sourced from HUD Home Store.",
        createdAt: daysAgo(9),
      },
      {
        dealId: marketing.id,
        type: "CONTRACT",
        message: "Locked under contract — earnest money and inspection terms saved.",
        createdAt: daysAgo(5),
      },
      {
        dealId: marketing.id,
        type: "BUYER_ASSIGNED",
        message: `Assigned to ${buyer.name} for a $18,000 fee.`,
        createdAt: daysAgo(2),
      },
    ],
  });

  const closed = await prisma.deal.create({
    data: {
      address: "775 Lakeshore Dr",
      city: "Sherman",
      state: "TX",
      zip: "75090",
      sourceSite: "Treasury.gov",
      purchasePrice: 7000,
      estimatedValue: 105000,
      rentComp: 1300,
      status: "CLOSED",
      earnestMoney: 1000,
      inspectionDays: 21,
      contractDate: daysAgo(30),
      assignmentFee: 25000,
      closingDate: daysAgo(3),
      buyerId: buyer.id,
      notes: "Closed through title company, wired same day.",
      createdAt: daysAgo(35),
    },
  });
  await prisma.dealActivity.createMany({
    data: [
      {
        dealId: closed.id,
        type: "CREATED",
        message: "Deal sourced from Treasury.gov.",
        createdAt: daysAgo(35),
      },
      {
        dealId: closed.id,
        type: "CONTRACT",
        message: "Locked under contract — earnest money and inspection terms saved.",
        createdAt: daysAgo(30),
      },
      {
        dealId: closed.id,
        type: "BUYER_ASSIGNED",
        message: `Assigned to ${buyer.name} for a $25,000 fee.`,
        createdAt: daysAgo(10),
      },
      {
        dealId: closed.id,
        type: "CLOSED",
        message: "Closed — collected $25,000.",
        createdAt: daysAgo(3),
      },
    ],
  });

  console.log("Seeded 1 buyer, 4 deals, and their activity timelines.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
