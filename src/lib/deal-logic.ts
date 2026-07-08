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
