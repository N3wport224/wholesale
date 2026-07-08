import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DEAL_STATUSES,
  DealStatus,
  STATUS_LABELS,
  formatCurrency,
  matchesCriteria,
  spread,
} from "@/lib/deal-logic";
import { DealCard } from "@/components/DealCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const deals = await prisma.deal.findMany({
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
  });

  const byStatus = new Map<DealStatus, typeof deals>();
  for (const status of DEAL_STATUSES) byStatus.set(status, []);
  for (const deal of deals) {
    const list = byStatus.get(deal.status as DealStatus);
    if (list) list.push(deal);
    else byStatus.set("SOURCED", [...(byStatus.get("SOURCED") ?? []), deal]);
  }

  const activeDeals = deals.filter((d) => d.status !== "DEAD");
  const matchingDeals = activeDeals.filter((d) =>
    matchesCriteria(d.purchasePrice, d.estimatedValue)
  );
  const totalSpread = activeDeals.reduce(
    (sum, d) => sum + spread(d.purchasePrice, d.estimatedValue),
    0
  );
  const closedProfit = deals
    .filter((d) => d.status === "CLOSED")
    .reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  const stats = [
    { label: "Active deals", value: activeDeals.length.toString() },
    { label: "Matching filter criteria", value: matchingDeals.length.toString() },
    { label: "Total spread in pipeline", value: formatCurrency(totalSpread) },
    { label: "Closed profit collected", value: formatCurrency(closedProfit) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deal Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Source seized-property deals, filter for the spread, lock them under an assignable
          contract, then flip to a cash buyer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">{s.value}</p>
          </div>
        ))}
      </div>

      {deals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-10 text-center">
          <p className="text-neutral-300">No deals yet.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Add a deal you found on USMarshals.gov, GSAAuctions.gov, Treasury.gov, or HUD Home
            Store to start the pipeline.
          </p>
          <Link
            href="/deals/new"
            className="mt-4 inline-block rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
          >
            + New Deal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DEAL_STATUSES.map((status) => {
            const list = byStatus.get(status) ?? [];
            return (
              <div key={status} className="min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {STATUS_LABELS[status]}
                  </h2>
                  <span className="text-xs text-neutral-600">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.map((deal) => (
                    <DealCard
                      key={deal.id}
                      id={deal.id}
                      address={deal.address}
                      city={deal.city}
                      state={deal.state}
                      sourceSite={deal.sourceSite}
                      purchasePrice={deal.purchasePrice}
                      estimatedValue={deal.estimatedValue}
                      buyerName={deal.buyer?.name}
                      assignmentFee={deal.assignmentFee}
                    />
                  ))}
                  {list.length === 0 && (
                    <p className="rounded-lg border border-dashed border-neutral-800 p-3 text-center text-xs text-neutral-600">
                      Empty
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
