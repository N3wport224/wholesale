import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DEAL_STATUSES,
  DealStatus,
  STATUS_LABELS,
  SOURCE_SITES,
  daysUntil,
  formatCurrency,
  inspectionDeadline,
  inspectionStatusLabel,
  matchesCriteria,
  spread,
} from "@/lib/deal-logic";
import { matchesDealFilters } from "@/lib/deal-query";
import { DealCard } from "@/components/DealCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; matchOnly?: string }>;
}) {
  const filters = await searchParams;
  const allDeals = await prisma.deal.findMany({
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
  });

  const activeDeals = allDeals.filter((d) => d.status !== "DEAD");
  const matchingDeals = activeDeals.filter((d) =>
    matchesCriteria(d.purchasePrice, d.estimatedValue)
  );
  const totalSpread = activeDeals.reduce(
    (sum, d) => sum + spread(d.purchasePrice, d.estimatedValue),
    0
  );
  const closedProfit = allDeals
    .filter((d) => d.status === "CLOSED")
    .reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  const stats = [
    { label: "Active deals", value: activeDeals.length.toString() },
    { label: "Matching filter criteria", value: matchingDeals.length.toString() },
    { label: "Total spread in pipeline", value: formatCurrency(totalSpread) },
    { label: "Closed profit collected", value: formatCurrency(closedProfit) },
  ];

  const needsAttention: Array<{ id: string; address: string; label: string; days: number }> = [];
  for (const d of allDeals) {
    if (d.status !== "UNDER_CONTRACT") continue;
    const inspection = inspectionStatusLabel(d.contractDate, d.inspectionDays);
    if (!inspection || !inspection.urgent) continue;
    const days = daysUntil(inspectionDeadline(d.contractDate, d.inspectionDays)) ?? 0;
    needsAttention.push({ id: d.id, address: d.address, label: inspection.label, days });
  }
  needsAttention.sort((a, b) => a.days - b.days);

  const hasActiveFilters = Boolean(
    filters.q?.trim() || (filters.source && filters.source !== "All") || filters.matchOnly === "1"
  );
  const filteredDeals = hasActiveFilters
    ? allDeals.filter((d) => matchesDealFilters(d, filters))
    : allDeals;

  const byStatus = new Map<DealStatus, typeof allDeals>();
  for (const status of DEAL_STATUSES) byStatus.set(status, []);
  for (const deal of filteredDeals) {
    const list = byStatus.get(deal.status as DealStatus);
    if (list) list.push(deal);
    else byStatus.get("SOURCED")?.push(deal);
  }
  for (const list of byStatus.values()) {
    list.sort(
      (a, b) => spread(b.purchasePrice, b.estimatedValue) - spread(a.purchasePrice, a.estimatedValue)
    );
  }

  const exportQuery = new URLSearchParams();
  if (filters.q?.trim()) exportQuery.set("q", filters.q.trim());
  if (filters.source && filters.source !== "All") exportQuery.set("source", filters.source);
  if (filters.matchOnly === "1") exportQuery.set("matchOnly", "1");
  const exportHref = `/deals/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ""}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deal Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Source seized-property deals, filter for the spread, lock them under an assignable
          contract, then flip to a cash buyer.
        </p>
      </div>

      {needsAttention.length > 0 && (
        <div className="space-y-2 rounded-lg border border-red-900 bg-red-950/20 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-red-400">
            Needs attention — inspection deadline
          </h2>
          <div className="space-y-1.5">
            {needsAttention.map((item) => (
              <Link
                key={item.id}
                href={`/deals/${item.id}`}
                className="flex items-center justify-between gap-4 text-sm text-neutral-200 hover:text-white"
              >
                <span className="truncate">{item.address}</span>
                <span className="shrink-0 font-medium text-red-400">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">{s.value}</p>
          </div>
        ))}
      </div>

      {allDeals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-10 text-center">
          <p className="text-neutral-300">No deals yet.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Add a deal you found on USMarshals.gov, GSAAuctions.gov, Treasury.gov, or HUD Home
            Store to start the pipeline.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/deals/new"
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
            >
              + New Deal
            </Link>
            <Link
              href="/deals/import"
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Import CSV
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form
            method="get"
            key={`${filters.q ?? ""}|${filters.source ?? ""}|${filters.matchOnly ?? ""}`}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div>
              <label className="block text-xs text-neutral-400">Search</label>
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Address, city, or zip"
                className="mt-1 w-48 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400">Source</label>
              <select
                name="source"
                defaultValue={filters.source ?? "All"}
                className="mt-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All sources</option>
                {SOURCE_SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pb-1.5 text-sm text-neutral-300">
              <input
                type="checkbox"
                name="matchOnly"
                value="1"
                defaultChecked={filters.matchOnly === "1"}
                className="rounded border-neutral-700 bg-neutral-900"
              />
              Matching only
            </label>
            <button
              type="submit"
              className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
            >
              Filter
            </button>
            {hasActiveFilters && (
              <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
                Clear
              </Link>
            )}
            <Link
              href="/deals/import"
              className="ml-auto rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Import CSV
            </Link>
            <a
              href={exportHref}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Export CSV
            </a>
          </form>

          {filteredDeals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
              No deals match these filters.
            </p>
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
                          status={deal.status}
                          sourceSite={deal.sourceSite}
                          purchasePrice={deal.purchasePrice}
                          estimatedValue={deal.estimatedValue}
                          contractDate={deal.contractDate}
                          inspectionDays={deal.inspectionDays}
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
        </>
      )}
    </div>
  );
}
