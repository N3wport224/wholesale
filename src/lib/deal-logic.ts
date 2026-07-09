export const SOURCE_SITES = [
  "USMarshals.gov",
  "GSAAuctions.gov",
  "Treasury.gov",
  "HUD Home Store",
  "Other",
] as const;

export type SourceSite = (typeof SOURCE_SITES)[number];

export const DEAL_STATUSES = [
  "SOURCED",
  "UNDER_CONTRACT",
  "MARKETING",
  "CLOSED",
  "DEAD",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

export const STATUS_LABELS: Record<DealStatus, string> = {
  SOURCED: "1-2. Sourced",
  UNDER_CONTRACT: "3. Under Contract",
  MARKETING: "4. Marketing to Buyers",
  CLOSED: "5. Closed",
  DEAD: "Dead",
};

// Filter criteria from the playbook: purchase $2K-$10K, true value $50K+.
export const CRITERIA = {
  minPurchasePrice: 2000,
  maxPurchasePrice: 10000,
  minEstimatedValue: 50000,
};

export function matchesCriteria(purchasePrice: number, estimatedValue: number) {
  return (
    purchasePrice >= CRITERIA.minPurchasePrice &&
    purchasePrice <= CRITERIA.maxPurchasePrice &&
    estimatedValue >= CRITERIA.minEstimatedValue
  );
}

export function spread(purchasePrice: number, estimatedValue: number) {
  return estimatedValue - purchasePrice;
}

export function suggestedAssignmentFee(purchasePrice: number, estimatedValue: number) {
  const gap = spread(purchasePrice, estimatedValue);
  // Mark up $5K-$30K, capped so it never eats the whole spread.
  const low = 5000;
  const high = Math.min(30000, Math.max(low, Math.round(gap * 0.3)));
  return { low, high };
}

export function assignedContractPrice(purchasePrice: number, assignmentFee: number) {
  return purchasePrice + assignmentFee;
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTargetStates(states: string | null | undefined) {
  if (!states) return "Any state";
  return states
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export function buyerMatchesDeal(
  buyer: { minPrice: number | null; maxPrice: number | null; targetStates: string | null },
  deal: { purchasePrice: number; assignmentFee?: number | null; state: string }
) {
  const contractPrice = deal.purchasePrice + (deal.assignmentFee ?? 0);
  if (buyer.minPrice !== null && contractPrice < buyer.minPrice) return false;
  if (buyer.maxPrice !== null && contractPrice > buyer.maxPrice) return false;
  if (buyer.targetStates) {
    const states = buyer.targetStates.split(",").map((s) => s.trim().toUpperCase());
    if (!states.includes(deal.state.toUpperCase())) return false;
  }
  return true;
}

// Rough estimate for buy-and-hold buyers: annual rent / total contract price.
export function estimatedCapRate(
  purchasePrice: number,
  assignmentFee: number | null | undefined,
  rentComp: number | null | undefined
) {
  if (!rentComp || rentComp <= 0) return null;
  const totalPrice = purchasePrice + (assignmentFee ?? 0);
  if (totalPrice <= 0) return null;
  return (rentComp * 12) / totalPrice;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function inspectionDeadline(
  contractDate: Date | null | undefined,
  inspectionDays: number | null | undefined
) {
  if (!contractDate || !inspectionDays) return null;
  const deadline = new Date(contractDate);
  deadline.setDate(deadline.getDate() + inspectionDays);
  return deadline;
}

export function daysUntil(date: Date | null | undefined, from: Date = new Date()) {
  if (!date) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function inspectionStatusLabel(
  contractDate: Date | null | undefined,
  inspectionDays: number | null | undefined
) {
  const deadline = inspectionDeadline(contractDate, inspectionDays);
  if (!deadline) return null;
  const days = daysUntil(deadline);
  if (days === null) return null;
  if (days < 0) return { label: `Inspection ended ${Math.abs(days)}d ago`, urgent: true };
  if (days === 0) return { label: "Inspection ends today", urgent: true };
  if (days <= 3) return { label: `Inspection ends in ${days}d`, urgent: true };
  return { label: `Inspection ends in ${days}d`, urgent: false };
}

const CSV_HEADERS = [
  "Address",
  "City",
  "State",
  "Zip",
  "Source",
  "Status",
  "Purchase Price",
  "Estimated Value",
  "Spread",
  "Rent Comp",
  "Buyer",
  "Assignment Fee",
  "Contract Date",
  "Closing Date",
] as const;

function csvEscape(value: string | number | null | undefined) {
  let str = value === null || value === undefined ? "" : String(value);
  // Neutralize formula injection (=, +, -, @) so spreadsheet apps don't execute cell contents.
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function dealsToCsv(
  deals: Array<{
    address: string;
    city: string;
    state: string;
    zip: string;
    sourceSite: string;
    status: string;
    purchasePrice: number;
    estimatedValue: number;
    rentComp: number | null;
    buyer?: { name: string } | null;
    assignmentFee: number | null;
    contractDate: Date | null;
    closingDate: Date | null;
  }>
) {
  const rows = deals.map((d) =>
    [
      d.address,
      d.city,
      d.state,
      d.zip,
      d.sourceSite,
      STATUS_LABELS[d.status as DealStatus] ?? d.status,
      d.purchasePrice,
      d.estimatedValue,
      spread(d.purchasePrice, d.estimatedValue),
      d.rentComp ?? "",
      d.buyer?.name ?? "",
      d.assignmentFee ?? "",
      d.contractDate ? d.contractDate.toISOString().slice(0, 10) : "",
      d.closingDate ? d.closingDate.toISOString().slice(0, 10) : "",
    ]
      .map(csvEscape)
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

const BUYER_CSV_HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Min Price",
  "Max Price",
  "Target States",
  "Deals Assigned",
  "Notes",
] as const;

export function buyersToCsv(
  buyers: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    targetStates: string | null;
    notes: string | null;
    deals?: unknown[];
  }>
) {
  const rows = buyers.map((b) =>
    [
      b.name,
      b.email ?? "",
      b.phone ?? "",
      b.minPrice ?? "",
      b.maxPrice ?? "",
      formatTargetStates(b.targetStates) === "Any state" ? "" : formatTargetStates(b.targetStates),
      b.deals?.length ?? 0,
      b.notes ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );
  return [BUYER_CSV_HEADERS.join(","), ...rows].join("\n");
}

export type ParsedField<T> = { value: T | null } | { error: string };

// Parses an optional form field, distinguishing "left blank" (a legitimate
// null) from "present but not a valid number/date" (a validation error) —
// the two must never be conflated into the same null, or a garbage value
// silently overwrites a previously-saved good one with no error shown.
export function parseOptionalNumber(raw: string, label: string): ParsedField<number> {
  if (raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { error: `${label} must be a valid number.` };
  return { value: n };
}

export function parseOptionalInteger(raw: string, label: string): ParsedField<number> {
  if (raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isInteger(n)) return { error: `${label} must be a whole number.` };
  return { value: n };
}

export function parseOptionalDate(raw: string, label: string): ParsedField<Date> {
  if (raw === "") return { value: null };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { error: `${label} isn't a valid date.` };
  return { value: d };
}

export type PipelineAnalytics = {
  totalDeals: number;
  byStatus: Record<DealStatus, number>;
  everReachedContract: number;
  everReachedMarketing: number;
  closedCount: number;
  deadCount: number;
  conversionRates: {
    sourcedToContract: number | null;
    contractToMarketing: number | null;
    marketingToClosed: number | null;
    overallSourcedToClosed: number | null;
  };
  avgDaysSourcedToContract: number | null;
  avgDaysContractToClosed: number | null;
  avgDaysSourcedToClosed: number | null;
  avgSpread: number | null;
  avgAssignmentFee: number | null;
  totalFeesCollected: number;
  winRate: number | null;
  dealsByMonth: { month: string; count: number }[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

export function computePipelineAnalytics(
  deals: Array<{
    status: string;
    createdAt: Date;
    contractDate: Date | null;
    closingDate: Date | null;
    purchasePrice: number;
    estimatedValue: number;
    assignmentFee: number | null;
  }>,
  now: Date = new Date()
): PipelineAnalytics {
  const byStatus = Object.fromEntries(DEAL_STATUSES.map((s) => [s, 0])) as Record<DealStatus, number>;
  for (const d of deals) {
    const status = d.status as DealStatus;
    if (status in byStatus) byStatus[status]++;
  }

  const everReachedContract = deals.filter((d) => d.contractDate !== null).length;
  const everReachedMarketing = deals.filter((d) => d.assignmentFee !== null).length;
  const closedCount = byStatus.CLOSED;
  const deadCount = byStatus.DEAD;

  const rate = (numerator: number, denominator: number) => (denominator === 0 ? null : numerator / denominator);

  const conversionRates = {
    sourcedToContract: rate(everReachedContract, deals.length),
    contractToMarketing: rate(everReachedMarketing, everReachedContract),
    marketingToClosed: rate(closedCount, everReachedMarketing),
    overallSourcedToClosed: rate(closedCount, deals.length),
  };

  const daysSourcedToContract = deals
    .filter((d) => d.contractDate !== null)
    .map((d) => daysBetween(d.createdAt, d.contractDate as Date));
  const daysContractToClosed = deals
    .filter((d) => d.contractDate !== null && d.closingDate !== null)
    .map((d) => daysBetween(d.contractDate as Date, d.closingDate as Date));
  const daysSourcedToClosed = deals
    .filter((d) => d.closingDate !== null)
    .map((d) => daysBetween(d.createdAt, d.closingDate as Date));

  const activeDeals = deals.filter((d) => d.status !== "DEAD");
  const avgSpread = average(activeDeals.map((d) => spread(d.purchasePrice, d.estimatedValue)));

  const closedDeals = deals.filter((d) => d.status === "CLOSED");
  const avgAssignmentFee = average(
    closedDeals.filter((d) => d.assignmentFee !== null).map((d) => d.assignmentFee as number)
  );
  const totalFeesCollected = closedDeals.reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  const winRate = rate(closedCount, closedCount + deadCount);

  const dealsByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const count = deals.filter(
      (d) =>
        d.createdAt.getFullYear() === monthDate.getFullYear() &&
        d.createdAt.getMonth() === monthDate.getMonth()
    ).length;
    dealsByMonth.push({ month: label, count });
  }

  return {
    totalDeals: deals.length,
    byStatus,
    everReachedContract,
    everReachedMarketing,
    closedCount,
    deadCount,
    conversionRates,
    avgDaysSourcedToContract: average(daysSourcedToContract),
    avgDaysContractToClosed: average(daysContractToClosed),
    avgDaysSourcedToClosed: average(daysSourcedToClosed),
    avgSpread,
    avgAssignmentFee,
    totalFeesCollected,
    winRate,
    dealsByMonth,
  };
}

export function assignableOfferClause(buyerName: string) {
  const name = buyerName.trim() || "[Your Name]";
  return `Buyer: ${name} and/or Assigns`;
}

export function marketingBlurb(deal: {
  address: string;
  city: string;
  state: string;
  zip: string;
  purchasePrice: number;
  estimatedValue: number;
  rentComp?: number | null;
  assignmentFee?: number | null;
}) {
  const askingPrice = assignedContractPrice(
    deal.purchasePrice,
    deal.assignmentFee ?? suggestedAssignmentFee(deal.purchasePrice, deal.estimatedValue).low
  );
  const capRate = estimatedCapRate(askingPrice, 0, deal.rentComp);
  const rentLine = deal.rentComp
    ? `\nEstimated rent comp: ${formatCurrency(deal.rentComp)}/mo${
        capRate ? ` (~${formatPercent(capRate)} cap rate at asking price)` : ""
      }.`
    : "";

  return `WHOLESALE CONTRACT AVAILABLE — ${deal.address}, ${deal.city}, ${deal.state} ${deal.zip}

Under contract at ${formatCurrency(deal.purchasePrice)}. Estimated value: ${formatCurrency(
    deal.estimatedValue
  )}.${rentLine}

Assignable contract — I'm selling my equitable interest for ${formatCurrency(
    askingPrice
  )}. POF/proof of funds required, cash or hard money only. Serious investors DM for details, comps, and access to the property.`;
}
