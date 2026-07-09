import { describe, expect, it } from "vitest";
import {
  CRITERIA,
  assignableOfferClause,
  assignedContractPrice,
  buyerMatchesDeal,
  buyersToCsv,
  daysUntil,
  dealsToCsv,
  estimatedCapRate,
  formatCurrency,
  formatPercent,
  formatTargetStates,
  inspectionDeadline,
  inspectionStatusLabel,
  marketingBlurb,
  matchesCriteria,
  parseOptionalDate,
  parseOptionalInteger,
  parseOptionalNumber,
  spread,
  suggestedAssignmentFee,
} from "./deal-logic";
import { parseCsv } from "./csv";

describe("matchesCriteria", () => {
  it("matches a deal within the purchase-price and value bands", () => {
    expect(matchesCriteria(6500, 78000)).toBe(true);
  });

  it("rejects a purchase price below the band", () => {
    expect(matchesCriteria(1999, 78000)).toBe(false);
  });

  it("rejects a purchase price above the band", () => {
    expect(matchesCriteria(10001, 78000)).toBe(false);
  });

  it("rejects an estimated value below the minimum", () => {
    expect(matchesCriteria(6500, 49999)).toBe(false);
  });

  it("is inclusive at the exact band boundaries", () => {
    expect(matchesCriteria(CRITERIA.minPurchasePrice, CRITERIA.minEstimatedValue)).toBe(true);
    expect(matchesCriteria(CRITERIA.maxPurchasePrice, CRITERIA.minEstimatedValue)).toBe(true);
  });
});

describe("spread", () => {
  it("subtracts purchase price from estimated value", () => {
    expect(spread(6500, 78000)).toBe(71500);
  });

  it("can be negative for a bad deal", () => {
    expect(spread(90000, 78000)).toBe(-12000);
  });
});

describe("suggestedAssignmentFee", () => {
  it("returns the $5K floor for a small spread", () => {
    const { low, high } = suggestedAssignmentFee(6500, 8000);
    expect(low).toBe(5000);
    expect(high).toBe(5000);
  });

  it("caps the high end at $30K for a huge spread", () => {
    const { low, high } = suggestedAssignmentFee(1000, 500000);
    expect(low).toBe(5000);
    expect(high).toBe(30000);
  });

  it("never returns a high below the low, even for a negative spread", () => {
    const { low, high } = suggestedAssignmentFee(90000, 78000);
    expect(high).toBeGreaterThanOrEqual(low);
  });
});

describe("assignedContractPrice", () => {
  it("adds the assignment fee to the purchase price", () => {
    expect(assignedContractPrice(6500, 5000)).toBe(11500);
  });
});

describe("formatCurrency", () => {
  it("formats a positive number as whole-dollar USD", () => {
    expect(formatCurrency(78000)).toBe("$78,000");
  });

  it("returns an em dash for null, undefined, and NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });

  it("formats zero as $0, not an em dash", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a rounded percent", () => {
    expect(formatPercent(0.488)).toBe("48.8%");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});

describe("formatTargetStates", () => {
  it("returns 'Any state' for null or empty", () => {
    expect(formatTargetStates(null)).toBe("Any state");
    expect(formatTargetStates(undefined)).toBe("Any state");
  });

  it("joins comma-separated codes with a readable separator", () => {
    expect(formatTargetStates("TX,OK")).toBe("TX, OK");
  });

  it("trims whitespace around codes", () => {
    expect(formatTargetStates(" TX , OK ")).toBe("TX, OK");
  });
});

describe("estimatedCapRate", () => {
  it("computes annual rent over total price", () => {
    // $1,300/mo * 12 = $15,600 annual rent over a $32,000 total price
    expect(estimatedCapRate(7000, 25000, 1300)).toBeCloseTo(15600 / 32000, 5);
  });

  it("returns null when there's no rent comp", () => {
    expect(estimatedCapRate(7000, 25000, null)).toBeNull();
    expect(estimatedCapRate(7000, 25000, 0)).toBeNull();
  });

  it("treats a missing assignment fee as zero", () => {
    expect(estimatedCapRate(6500, null, 950)).toBeCloseTo((950 * 12) / 6500, 5);
  });
});

describe("buyerMatchesDeal", () => {
  const deal = { purchasePrice: 6500, assignmentFee: 5000, state: "OK" };

  it("matches when price and state are both in range", () => {
    expect(
      buyerMatchesDeal({ minPrice: 5000, maxPrice: 40000, targetStates: "TX,OK" }, deal)
    ).toBe(true);
  });

  it("rejects when the contract price is below the buyer's minimum", () => {
    expect(buyerMatchesDeal({ minPrice: 20000, maxPrice: null, targetStates: null }, deal)).toBe(
      false
    );
  });

  it("rejects when the contract price is above the buyer's maximum", () => {
    expect(buyerMatchesDeal({ minPrice: null, maxPrice: 10000, targetStates: null }, deal)).toBe(
      false
    );
  });

  it("rejects when the deal's state isn't in the buyer's target list", () => {
    expect(buyerMatchesDeal({ minPrice: null, maxPrice: null, targetStates: "TX" }, deal)).toBe(
      false
    );
  });

  it("treats no price bounds or target states as matching anything", () => {
    expect(
      buyerMatchesDeal({ minPrice: null, maxPrice: null, targetStates: null }, deal)
    ).toBe(true);
  });

  it("is case-insensitive when matching states", () => {
    expect(
      buyerMatchesDeal(
        { minPrice: null, maxPrice: null, targetStates: "tx,ok" },
        { ...deal, state: "ok" }
      )
    ).toBe(true);
  });
});

describe("inspectionDeadline / daysUntil / inspectionStatusLabel", () => {
  it("returns null when either input is missing", () => {
    expect(inspectionDeadline(null, 21)).toBeNull();
    expect(inspectionDeadline(new Date(), null)).toBeNull();
  });

  it("adds inspection days to the contract date", () => {
    const contractDate = new Date(2026, 0, 1); // Jan 1, 2026
    const deadline = inspectionDeadline(contractDate, 21);
    expect(deadline).toEqual(new Date(2026, 0, 22));
  });

  it("daysUntil computes whole-day differences", () => {
    const from = new Date(2026, 0, 1);
    expect(daysUntil(new Date(2026, 0, 4), from)).toBe(3);
    expect(daysUntil(new Date(2025, 11, 29), from)).toBe(-3);
    expect(daysUntil(new Date(2026, 0, 1), from)).toBe(0);
  });

  it("flags the deadline as urgent within 3 days, today, or overdue", () => {
    const today = new Date();
    const in2Days = new Date(today);
    in2Days.setDate(in2Days.getDate() - 19); // contractDate 19 days ago
    const label21 = inspectionStatusLabel(in2Days, 21); // deadline in 2 days
    expect(label21?.urgent).toBe(true);
    expect(label21?.label).toContain("2d");

    const overdue = new Date(today);
    overdue.setDate(overdue.getDate() - 30);
    const labelOverdue = inspectionStatusLabel(overdue, 21); // deadline 9 days ago
    expect(labelOverdue?.urgent).toBe(true);
    expect(labelOverdue?.label).toContain("ago");

    const farOut = new Date(today);
    const labelFar = inspectionStatusLabel(farOut, 21); // deadline in 21 days
    expect(labelFar?.urgent).toBe(false);
  });

  it("returns null when there is no deadline to report", () => {
    expect(inspectionStatusLabel(null, null)).toBeNull();
  });
});

describe("dealsToCsv", () => {
  const baseDeal = {
    address: "412 Birchwood Ave",
    city: "Tulsa",
    state: "OK",
    zip: "74106",
    sourceSite: "GSAAuctions.gov",
    status: "SOURCED",
    purchasePrice: 6500,
    estimatedValue: 78000,
    rentComp: 950,
    buyer: null,
    assignmentFee: null,
    contractDate: null,
    closingDate: null,
  };

  it("includes a header row and one row per deal", () => {
    const csv = dealsToCsv([baseDeal]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Address");
    expect(lines[1]).toContain("412 Birchwood Ave");
  });

  it("quotes fields containing commas", () => {
    const csv = dealsToCsv([{ ...baseDeal, address: "123 Main St, Apt 4" }]);
    expect(csv).toContain('"123 Main St, Apt 4"');
  });

  it("escapes embedded quotes by doubling them", () => {
    const csv = dealsToCsv([{ ...baseDeal, city: 'Tulsa "Downtown"' }]);
    expect(csv).toContain('"Tulsa ""Downtown"""');
  });

  it("neutralizes formula-injection payloads with a leading quote", () => {
    const csv = dealsToCsv([{ ...baseDeal, address: '=cmd|"/c calc"!A1' }]);
    const line = csv.split("\n")[1];
    expect(line.startsWith('"\'=cmd')).toBe(true);
  });

  it("maps a known status to its display label", () => {
    const csv = dealsToCsv([{ ...baseDeal, status: "UNDER_CONTRACT" }]);
    expect(csv).toContain("3. Under Contract");
  });

  it("falls back to the raw status string for an unknown value", () => {
    const csv = dealsToCsv([{ ...baseDeal, status: "WEIRD" }]);
    expect(csv).toContain("WEIRD");
  });
});

describe("buyersToCsv", () => {
  const baseBuyer = {
    name: "Marcus Reid",
    email: "marcus@example.com",
    phone: "555-1234",
    minPrice: 5000,
    maxPrice: 40000,
    targetStates: "TX,OK",
    notes: null,
    deals: [{}, {}],
  };

  it("includes a header row and one row per buyer", () => {
    const csv = buyersToCsv([baseBuyer]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Name");
    expect(lines[1]).toContain("Marcus Reid");
  });

  it("formats target states and counts assigned deals", () => {
    const csv = buyersToCsv([baseBuyer]);
    const row = parseCsv(csv)[1];
    // Name,Email,Phone,MinPrice,MaxPrice,TargetStates,Deals,Notes
    expect(row[5]).toBe("TX, OK");
    expect(row[6]).toBe("2");
  });

  it("renders an unrestricted buy-box as an empty target-states cell", () => {
    const csv = buyersToCsv([{ ...baseBuyer, targetStates: null }]);
    const row = parseCsv(csv)[1];
    expect(row[5]).toBe("");
  });

  it("neutralizes formula-injection payloads in the name", () => {
    const csv = buyersToCsv([{ ...baseBuyer, name: "=cmd|'/c calc'!A1" }]);
    const row = parseCsv(csv)[1];
    expect(row[0].startsWith("'=cmd")).toBe(true);
  });

  it("defaults deal count to zero when deals aren't included", () => {
    const buyerWithoutDeals = {
      name: baseBuyer.name,
      email: baseBuyer.email,
      phone: baseBuyer.phone,
      minPrice: baseBuyer.minPrice,
      maxPrice: baseBuyer.maxPrice,
      targetStates: baseBuyer.targetStates,
      notes: baseBuyer.notes,
    };
    const csv = buyersToCsv([buyerWithoutDeals]);
    const row = parseCsv(csv)[1];
    expect(row[6]).toBe("0");
  });
});

describe("parseOptionalNumber", () => {
  it("treats a blank string as legitimately absent", () => {
    expect(parseOptionalNumber("", "Earnest money")).toEqual({ value: null });
  });

  it("parses a valid number", () => {
    expect(parseOptionalNumber("750", "Earnest money")).toEqual({ value: 750 });
  });

  it("errors — rather than silently discarding — a non-numeric value", () => {
    expect(parseOptionalNumber("not-a-number", "Earnest money")).toEqual({
      error: "Earnest money must be a valid number.",
    });
  });

  it("errors on Infinity, which is not a usable value even though it parses", () => {
    expect(parseOptionalNumber("Infinity", "Earnest money")).toEqual({
      error: "Earnest money must be a valid number.",
    });
  });
});

describe("parseOptionalInteger", () => {
  it("treats a blank string as legitimately absent", () => {
    expect(parseOptionalInteger("", "Inspection period")).toEqual({ value: null });
  });

  it("parses a whole number", () => {
    expect(parseOptionalInteger("21", "Inspection period")).toEqual({ value: 21 });
  });

  it("errors on a non-integer value instead of silently discarding it", () => {
    expect(parseOptionalInteger("21.5", "Inspection period")).toEqual({
      error: "Inspection period must be a whole number.",
    });
  });

  it("errors on a non-numeric value", () => {
    expect(parseOptionalInteger("abc", "Inspection period")).toEqual({
      error: "Inspection period must be a whole number.",
    });
  });
});

describe("parseOptionalDate", () => {
  it("treats a blank string as legitimately absent", () => {
    expect(parseOptionalDate("", "Closing date")).toEqual({ value: null });
  });

  it("parses a valid date", () => {
    const result = parseOptionalDate("2026-01-15", "Closing date");
    expect("value" in result && result.value).toBeInstanceOf(Date);
  });

  it("errors on an unparseable date instead of silently discarding it", () => {
    expect(parseOptionalDate("not-a-date", "Closing date")).toEqual({
      error: "Closing date isn't a valid date.",
    });
  });
});

describe("assignableOfferClause", () => {
  it("uses the provided name", () => {
    expect(assignableOfferClause("Jane Doe LLC")).toBe("Buyer: Jane Doe LLC and/or Assigns");
  });

  it("falls back to a placeholder for an empty or whitespace-only name", () => {
    expect(assignableOfferClause("")).toBe("Buyer: [Your Name] and/or Assigns");
    expect(assignableOfferClause("   ")).toBe("Buyer: [Your Name] and/or Assigns");
  });
});

describe("marketingBlurb", () => {
  const deal = {
    address: "412 Birchwood Ave",
    city: "Tulsa",
    state: "OK",
    zip: "74106",
    purchasePrice: 6500,
    estimatedValue: 78000,
    rentComp: 950,
  };

  it("uses the explicit assignment fee when provided, not the suggested default", () => {
    const blurb = marketingBlurb({ ...deal, assignmentFee: 0 });
    expect(blurb).toContain("selling my equitable interest for $6,500");
  });

  it("falls back to the suggested low fee when none is set", () => {
    const blurb = marketingBlurb({ ...deal, assignmentFee: null });
    const { low } = suggestedAssignmentFee(deal.purchasePrice, deal.estimatedValue);
    expect(blurb).toContain(`selling my equitable interest for ${formatCurrency(deal.purchasePrice + low)}`);
  });

  it("omits the rent comp line entirely when there's no rent comp", () => {
    const blurb = marketingBlurb({ ...deal, rentComp: null, assignmentFee: 5000 });
    expect(blurb).not.toContain("rent comp");
  });

  it("includes the address in the headline", () => {
    const blurb = marketingBlurb({ ...deal, assignmentFee: 5000 });
    expect(blurb).toContain("412 Birchwood Ave, Tulsa, OK 74106");
  });
});
