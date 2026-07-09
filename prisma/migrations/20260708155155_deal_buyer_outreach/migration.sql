-- CreateTable
CREATE TABLE "DealBuyerOutreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealBuyerOutreach_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealBuyerOutreach_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DealBuyerOutreach_dealId_idx" ON "DealBuyerOutreach"("dealId");

-- CreateIndex
CREATE INDEX "DealBuyerOutreach_buyerId_idx" ON "DealBuyerOutreach"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "DealBuyerOutreach_dealId_buyerId_key" ON "DealBuyerOutreach"("dealId", "buyerId");
