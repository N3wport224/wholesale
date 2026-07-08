import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const buyer = await prisma.buyer.create({
    data: {
      name: "Marcus Reid",
      email: "marcus@reidcapital.com",
      phone: "555-201-8834",
      notes: "Buys single-family under $120K ARV in TX/OK, closes in 10 days, cash.",
    },
  });

  await prisma.deal.create({
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
    },
  });

  await prisma.deal.create({
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
      contractDate: new Date(),
      notes: "Seized in forfeiture case. Title company: River Valley Title.",
    },
  });

  await prisma.deal.create({
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
      contractDate: new Date(),
      assignmentFee: 18000,
      buyerId: buyer.id,
      notes: "Posted to BiggerPockets Marketplace, 3 buyers interested.",
    },
  });

  await prisma.deal.create({
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
      contractDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      assignmentFee: 25000,
      closingDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      buyerId: buyer.id,
      notes: "Closed through title company, wired same day.",
    },
  });

  console.log("Seeded 1 buyer and 4 deals.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
