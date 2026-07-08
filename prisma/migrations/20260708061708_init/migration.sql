-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "sourceSite" TEXT NOT NULL DEFAULT 'Other',
    "purchasePrice" REAL NOT NULL,
    "estimatedValue" REAL NOT NULL,
    "rentComp" REAL,
    "status" TEXT NOT NULL DEFAULT 'SOURCED',
    "earnestMoney" REAL,
    "inspectionDays" INTEGER,
    "contractDate" DATETIME,
    "assignmentFee" REAL,
    "closingDate" DATETIME,
    "notes" TEXT,
    "buyerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
