import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LABELS,
  DealStatus,
  assignedContractPrice,
  estimatedCapRate,
  formatCurrency,
  formatPercent,
  marketingBlurb,
  spread,
  suggestedAssignmentFee,
} from "@/lib/deal-logic";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

function toDateStr(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DealSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id }, include: { buyer: true } });
  if (!deal) notFound();

  const gap = spread(deal.purchasePrice, deal.estimatedValue);
  const suggested = suggestedAssignmentFee(deal.purchasePrice, deal.estimatedValue);
  const askingPrice = assignedContractPrice(deal.purchasePrice, deal.assignmentFee ?? suggested.low);
  const capRate = estimatedCapRate(deal.purchasePrice, deal.assignmentFee, deal.rentComp);
  const blurb = marketingBlurb({
    address: deal.address,
    city: deal.city,
    state: deal.state,
    zip: deal.zip,
    purchasePrice: deal.purchasePrice,
    estimatedValue: deal.estimatedValue,
    rentComp: deal.rentComp,
    assignmentFee: deal.assignmentFee,
  });

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/deals/${deal.id}`} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Back to deal
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-lg bg-white p-8 text-neutral-900 shadow-lg print:rounded-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Wholesale Deal Summary
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{deal.address}</h1>
            <p className="mt-0.5 text-sm text-neutral-600">
              {deal.city}, {deal.state} {deal.zip}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p>Source: {deal.sourceSite}</p>
            <p>Status: {STATUS_LABELS[deal.status as DealStatus]}</p>
            <p>Prepared {toDateStr(new Date())}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SheetStat label="Purchase price" value={formatCurrency(deal.purchasePrice)} />
          <SheetStat label="Estimated value" value={formatCurrency(deal.estimatedValue)} />
          <SheetStat label="Spread" value={formatCurrency(gap)} />
          <SheetStat label="Asking price" value={formatCurrency(askingPrice)} />
          <SheetStat label="Rent comp" value={deal.rentComp ? `${formatCurrency(deal.rentComp)}/mo` : "—"} />
          <SheetStat label="Est. cap rate" value={formatPercent(capRate)} />
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Contract terms
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-neutral-500">Earnest money</p>
              <p className="font-medium">{formatCurrency(deal.earnestMoney)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Inspection period</p>
              <p className="font-medium">{deal.inspectionDays ? `${deal.inspectionDays} days` : "—"}</p>
            </div>
            <div>
              <p className="text-neutral-500">Contract date</p>
              <p className="font-medium">{toDateStr(deal.contractDate)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Closing date</p>
              <p className="font-medium">{toDateStr(deal.closingDate)}</p>
            </div>
          </div>
        </div>

        {deal.buyer && (
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Assigned buyer
            </p>
            <p className="mt-2 text-sm font-medium">
              {deal.buyer.name}
              {deal.assignmentFee ? ` — ${formatCurrency(deal.assignmentFee)} assignment fee` : ""}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Marketing summary
          </p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-neutral-800">{blurb}</pre>
        </div>

        {deal.notes && (
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{deal.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
