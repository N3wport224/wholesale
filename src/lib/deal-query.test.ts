import { describe, expect, it } from "vitest";
import { buildDealWhere, matchesDealFilters } from "./deal-query";

describe("buildDealWhere", () => {
  it("returns an empty filter when nothing is set", () => {
    expect(buildDealWhere({})).toEqual({});
  });

  it("builds an OR clause across address/city/zip for a search term", () => {
    const where = buildDealWhere({ q: "Tulsa" });
    expect(where.OR).toEqual([
      { address: { contains: "Tulsa" } },
      { city: { contains: "Tulsa" } },
      { zip: { contains: "Tulsa" } },
    ]);
  });

  it("ignores a whitespace-only search term", () => {
    expect(buildDealWhere({ q: "   " })).toEqual({});
  });

  it("filters by source site only when it's a recognized value", () => {
    expect(buildDealWhere({ source: "GSAAuctions.gov" })).toEqual({
      sourceSite: "GSAAuctions.gov",
    });
    expect(buildDealWhere({ source: "All" })).toEqual({});
    expect(buildDealWhere({ source: "Not A Real Source" })).toEqual({});
  });

  it("adds price-band filters when matchOnly is set", () => {
    const where = buildDealWhere({ matchOnly: "1" });
    expect(where.purchasePrice).toEqual({ gte: 2000, lte: 10000 });
    expect(where.estimatedValue).toEqual({ gte: 50000 });
  });

  it("ignores matchOnly unless it's exactly '1'", () => {
    expect(buildDealWhere({ matchOnly: "true" })).toEqual({});
  });
});

describe("matchesDealFilters", () => {
  const deal = {
    address: "412 Birchwood Ave",
    city: "Tulsa",
    zip: "74106",
    sourceSite: "GSAAuctions.gov",
    purchasePrice: 6500,
    estimatedValue: 78000,
  };

  it("matches everything when there are no filters", () => {
    expect(matchesDealFilters(deal, {})).toBe(true);
  });

  it("matches a search term against address, city, or zip case-insensitively", () => {
    expect(matchesDealFilters(deal, { q: "birchwood" })).toBe(true);
    expect(matchesDealFilters(deal, { q: "TULSA" })).toBe(true);
    expect(matchesDealFilters(deal, { q: "74106" })).toBe(true);
    expect(matchesDealFilters(deal, { q: "Nowhere" })).toBe(false);
  });

  it("filters by source site", () => {
    expect(matchesDealFilters(deal, { source: "GSAAuctions.gov" })).toBe(true);
    expect(matchesDealFilters(deal, { source: "Treasury.gov" })).toBe(false);
  });

  it("treats an unrecognized source as no filter", () => {
    expect(matchesDealFilters(deal, { source: "All" })).toBe(true);
  });

  it("filters to matching-criteria deals only when matchOnly is set", () => {
    expect(matchesDealFilters(deal, { matchOnly: "1" })).toBe(true);
    expect(matchesDealFilters({ ...deal, purchasePrice: 50000 }, { matchOnly: "1" })).toBe(false);
  });

  it("combines multiple filters with AND semantics", () => {
    expect(matchesDealFilters(deal, { q: "Tulsa", source: "Treasury.gov" })).toBe(false);
    expect(matchesDealFilters(deal, { q: "Tulsa", source: "GSAAuctions.gov" })).toBe(true);
  });
});
