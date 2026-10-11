import { prisma } from "@/lib/prisma";
import { computePipelineAnalytics, formatCurrency, formatPercent } from "@/lib/deal-logic";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const deals = await prisma.deal.findMany({
    select: {
      status: true,
      createdAt: true,
      contractDate: true,
      closingDate: true,
      purchasePrice: true,
      estimatedValue: true,
      assignmentFee: true,
    },
  });

  const a = computePipelineAnalytics(deals);

  const funnelSteps = [
    { label: "Sourced", count: a.totalDeals, rate: null as number | null },
    { label: "Under Contract", count: a.everReachedContract, rate: a.conversionRates.sourcedToContract },
    { label: "Marketing", count: a.everReachedMarketing, rate: a.conversionRates.contractToMarketing },
    { label: "Closed", count: a.closedCount, rate: a.conversionRates.marketingToClosed },
  ];

  const maxMonthCount = Math.max(1, ...a.dealsByMonth.map((m) => m.count));

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline Analytics</h1>
        <p className="mt-1 text-sm text-neutral-400">
          How deals move through the pipeline and what they&apos;re worth.
        </p>
      </div>

      {a.totalDeals === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-800 p-10 text-center text-sm text-neutral-500">
          No deals yet — add some to see pipeline stats.
        </p>
      ) : (
        <>
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-300">
              Conversion funnel
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {funnelSteps.map((step) => (
                <div key={step.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <p className="text-xs text-neutral-500">{step.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-neutral-100">{step.count}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {step.rate === null ? "—" : `${formatPercent(step.rate)} of prior stage`}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Overall Sourced → Closed:{" "}
              <span className="font-medium text-neutral-300">
                {formatPercent(a.conversionRates.overallSourcedToClosed)}
              </span>
              {" · "}
              Win rate (Closed vs. Dead):{" "}
              <span className="font-medium text-neutral-300">{formatPercent(a.winRate)}</span>
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-300">
                Time in pipeline
              </h2>
              <dl className="space-y-3 text-sm">
                <Row label="Sourced → Under Contract" value={formatDays(a.avgDaysSourcedToContract)} />
                <Row label="Under Contract → Closed" value={formatDays(a.avgDaysContractToClosed)} />
                <Row label="Sourced → Closed" value={formatDays(a.avgDaysSourcedToClosed)} />
              </dl>
            </section>

            <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-300">
                Money
              </h2>
              <dl className="space-y-3 text-sm">
                <Row label="Avg. spread (active deals)" value={formatCurrency(a.avgSpread)} />
                <Row label="Avg. assignment fee (closed)" value={formatCurrency(a.avgAssignmentFee)} />
                <Row label="Total fees collected" value={formatCurrency(a.totalFeesCollected)} />
              </dl>
            </section>
          </div>

          <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-300">
              Deals sourced per month
            </h2>
            <div className="flex items-end gap-3 h-32">
              {a.dealsByMonth.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs text-neutral-400">{m.count}</span>
                  <div
                    className="w-full rounded-t bg-emerald-500/70"
                    style={{ height: `${(m.count / maxMonthCount) * 100}%`, minHeight: m.count > 0 ? "4px" : "1px" }}
                  />
                  <span className="text-[10px] text-neutral-600">{m.month}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatDays(days: number | null) {
  if (days === null) return "—";
  return `${days.toFixed(1)} days`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-200">{value}</dd>
    </div>
  );
}
