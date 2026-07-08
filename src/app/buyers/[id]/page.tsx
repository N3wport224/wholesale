import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteBuyer } from "@/lib/actions";
import {
  STATUS_LABELS,
  DealStatus,
  formatCurrency,
  formatTargetStates,
  spread,
} from "@/lib/deal-logic";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: { deals: { orderBy: { createdAt: "desc" } } },
  });
  if (!buyer) notFound();

  const closedDeals = buyer.deals.filter((d) => d.status === "CLOSED");
  const totalCollected = closedDeals.reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/buyers" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Back to buyers
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{buyer.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {[buyer.phone, buyer.email].filter(Boolean).join(" · ") || "No contact info"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/buyers/${buyer.id}/edit`}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Edit
          </Link>
          <form action={deleteBuyer.bind(null, buyer.id)}>
            <ConfirmSubmitButton
              confirmMessage={
                buyer.deals.length > 0
                  ? `Remove ${buyer.name}? ${buyer.deals.length} deal(s) assigned to them will become unassigned.`
                  : `Remove ${buyer.name}?`
              }
            >
              Remove
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Deals assigned" value={buyer.deals.length.toString()} />
        <Stat label="Deals closed" value={closedDeals.length.toString()} />
        <Stat label="Fees collected" value={formatCurrency(totalCollected)} />
        <Stat label="Target states" value={formatTargetStates(buyer.targetStates)} />
      </div>

      <section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">Buy box</h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-neutral-500">Min contract price</p>
            <p className="mt-0.5 text-neutral-200">{formatCurrency(buyer.minPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Max contract price</p>
            <p className="mt-0.5 text-neutral-200">{formatCurrency(buyer.maxPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Target states</p>
            <p className="mt-0.5 text-neutral-200">{formatTargetStates(buyer.targetStates)}</p>
          </div>
        </div>
        {buyer.notes && (
          <div className="border-t border-neutral-800 pt-3">
            <p className="text-xs text-neutral-500">Notes</p>
            <p className="mt-0.5 text-sm text-neutral-300">{buyer.notes}</p>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          Deal history
        </h2>
        {buyer.deals.length === 0 ? (
          <p className="text-sm text-neutral-500">No deals assigned to this buyer yet.</p>
        ) : (
          <div className="space-y-2">
            {buyer.deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="flex items-center justify-between gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-700"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-100">{deal.address}</p>
                  <p className="text-xs text-neutral-500">
                    {deal.city}, {deal.state} · {STATUS_LABELS[deal.status as DealStatus]}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="text-neutral-300">{formatCurrency(deal.assignmentFee)} fee</p>
                  <p className="text-neutral-600">
                    Spread {formatCurrency(spread(deal.purchasePrice, deal.estimatedValue))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-100">{value}</p>
    </div>
  );
}
