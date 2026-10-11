import Link from "next/link";
import { formatCurrency, inspectionStatusLabel, matchesCriteria, spread } from "@/lib/deal-logic";

type DealCardProps = {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
  sourceSite: string;
  purchasePrice: number;
  estimatedValue: number;
  contractDate: Date | null;
  inspectionDays: number | null;
  buyerName?: string | null;
  assignmentFee?: number | null;
};

export function DealCard(deal: DealCardProps) {
  const isMatch = matchesCriteria(deal.purchasePrice, deal.estimatedValue);
  const gap = spread(deal.purchasePrice, deal.estimatedValue);
  const inspection =
    deal.status === "UNDER_CONTRACT" ? inspectionStatusLabel(deal.contractDate, deal.inspectionDays) : null;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-700 hover:bg-neutral-850 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm text-neutral-100">{deal.address}</p>
          <p className="truncate text-xs text-neutral-500">
            {deal.city}, {deal.state}
          </p>
        </div>
        {isMatch && (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Match
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-neutral-400">{deal.sourceSite}</span>
        <span className="font-medium text-neutral-200">{formatCurrency(deal.purchasePrice)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-neutral-500">Spread</span>
        <span className="font-medium text-emerald-400">{formatCurrency(gap)}</span>
      </div>
      {deal.buyerName && (
        <p className="mt-2 truncate text-[11px] text-neutral-500">Buyer: {deal.buyerName}</p>
      )}
      {deal.assignmentFee != null && (
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Assignment fee: {formatCurrency(deal.assignmentFee)}
        </p>
      )}
      {inspection && (
        <p className={`mt-2 text-[11px] font-medium ${inspection.urgent ? "text-red-400" : "text-blue-400"}`}>
          {inspection.label}
        </p>
      )}
    </Link>
  );
}
