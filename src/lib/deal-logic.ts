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
  const rentLine = deal.rentComp
    ? `\nEstimated rent comp: ${formatCurrency(deal.rentComp)}/mo.`
    : "";

  return `WHOLESALE CONTRACT AVAILABLE — ${deal.address}, ${deal.city}, ${deal.state} ${deal.zip}

Under contract at ${formatCurrency(deal.purchasePrice)}. Estimated value: ${formatCurrency(
    deal.estimatedValue
  )}.${rentLine}

Assignable contract — I'm selling my equitable interest for ${formatCurrency(
    askingPrice
  )}. POF/proof of funds required, cash or hard money only. Serious investors DM for details, comps, and access to the property.`;
}
