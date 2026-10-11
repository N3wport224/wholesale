import type { Prisma } from "@/generated/prisma/client";
import { CRITERIA, SOURCE_SITES, matchesCriteria } from "@/lib/deal-logic";

export type DealFilters = {
  q?: string;
  source?: string;
  matchOnly?: string;
};

export function buildDealWhere(filters: DealFilters): Prisma.DealWhereInput {
  const where: Prisma.DealWhereInput = {};

  const q = filters.q?.trim();
  if (q) {
    where.OR = [{ address: { contains: q } }, { city: { contains: q } }, { zip: { contains: q } }];
  }

  if (filters.source && (SOURCE_SITES as readonly string[]).includes(filters.source)) {
    where.sourceSite = filters.source;
  }

  if (filters.matchOnly === "1") {
    where.purchasePrice = { gte: CRITERIA.minPurchasePrice, lte: CRITERIA.maxPurchasePrice };
    where.estimatedValue = { gte: CRITERIA.minEstimatedValue };
  }

  return where;
}

export function matchesDealFilters(
  deal: {
    address: string;
    city: string;
    zip: string;
    sourceSite: string;
    purchasePrice: number;
    estimatedValue: number;
  },
  filters: DealFilters
) {
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    const hit =
      deal.address.toLowerCase().includes(q) ||
      deal.city.toLowerCase().includes(q) ||
      deal.zip.toLowerCase().includes(q);
    if (!hit) return false;
  }

  if (
    filters.source &&
    (SOURCE_SITES as readonly string[]).includes(filters.source) &&
    deal.sourceSite !== filters.source
  ) {
    return false;
  }

  if (filters.matchOnly === "1" && !matchesCriteria(deal.purchasePrice, deal.estimatedValue)) {
    return false;
  }

  return true;
}
