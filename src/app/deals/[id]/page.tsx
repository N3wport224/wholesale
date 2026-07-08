import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LABELS,
  DealStatus,
  formatCurrency,
  matchesCriteria,
  spread,
} from "@/lib/deal-logic";
import {
  updateContractTerms,
  closeDeal,
  markDealDead,
  deleteDeal,
  updateDealNotes,
} from "@/lib/actions";
import { ContractClauseCard } from "@/components/ContractClauseCard";
import { MarketingBlurbCard } from "@/components/MarketingBlurbCard";
import { SubmitButton } from "@/components/SubmitButton";

function toInputDate(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) notFound();

  const buyers = await prisma.buyer.findMany({ orderBy: { name: "asc" } });
  const isMatch = matchesCriteria(deal.purchasePrice, deal.estimatedValue);
  const gap = spread(deal.purchasePrice, deal.estimatedValue);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{deal.address}</h1>
            {isMatch && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Match
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {deal.city}, {deal.state} {deal.zip} · Source: {deal.sourceSite}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Status: {STATUS_LABELS[deal.status as DealStatus]}
          </p>
        </div>
        <div className="flex gap-2">
          {deal.status !== "DEAD" && deal.status !== "CLOSED" && (
            <form action={markDealDead.bind(null, deal.id)}>
              <SubmitButton className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
                Mark dead
              </SubmitButton>
            </form>
          )}
          <form action={deleteDeal.bind(null, deal.id)}>
            <SubmitButton className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950">
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Purchase price" value={formatCurrency(deal.purchasePrice)} />
        <Stat label="Estimated value" value={formatCurrency(deal.estimatedValue)} />
        <Stat label="Spread" value={formatCurrency(gap)} accent />
        <Stat label="Rent comp" value={deal.rentComp ? `${formatCurrency(deal.rentComp)}/mo` : "—"} />
      </div>

      <Section title="Step 3 — Lock it under contract">
        <p className="text-sm text-neutral-400">
          Put an assignable-offer clause on your purchase agreement, then put down earnest money
          with an inspection period.
        </p>
        <ContractClauseCard />
        <form
          action={updateContractTerms.bind(null, deal.id)}
          className="grid grid-cols-1 gap-4 border-t border-neutral-800 pt-4 sm:grid-cols-3"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Earnest money ($500–$1,000)
            </label>
            <input
              name="earnestMoney"
              type="number"
              min={0}
              defaultValue={deal.earnestMoney ?? 500}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Inspection period (days)
            </label>
            <input
              name="inspectionDays"
              type="number"
              min={1}
              max={60}
              defaultValue={deal.inspectionDays ?? 21}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Contract date</label>
            <input
              name="contractDate"
              type="date"
              defaultValue={toInputDate(deal.contractDate)}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <SubmitButton>Save & move to Under Contract</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Step 4 — Find a cash buyer">
        <p className="text-sm text-neutral-400">
          Post the deal to investor Facebook groups, BiggerPockets Marketplace, or local
          Meetup.com networks, then record who you assigned it to.
        </p>
        <MarketingBlurbCard
          dealId={deal.id}
          address={deal.address}
          city={deal.city}
          state={deal.state}
          zip={deal.zip}
          purchasePrice={deal.purchasePrice}
          estimatedValue={deal.estimatedValue}
          rentComp={deal.rentComp}
          buyers={buyers}
          currentBuyerId={deal.buyerId}
          currentAssignmentFee={deal.assignmentFee}
        />
      </Section>

      <Section title="Step 5 — Close and collect">
        <p className="text-sm text-neutral-400">
          The title company handles the closing. Your buyer deposits funds, the title company
          cuts you a check for the assignment fee, and the property goes straight to the buyer.
        </p>
        {deal.status === "CLOSED" ? (
          <p className="rounded-md border border-emerald-800 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            Closed on {toInputDate(deal.closingDate) || "—"}. You collected{" "}
            {formatCurrency(deal.assignmentFee)}.
          </p>
        ) : (
          <form action={closeDeal.bind(null, deal.id)} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Closing date</label>
              <input
                name="closingDate"
                type="date"
                defaultValue={toInputDate(deal.closingDate)}
                className="mt-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <SubmitButton>Mark closed</SubmitButton>
          </form>
        )}
      </Section>

      <Section title="Notes">
        <form action={updateDealNotes.bind(null, deal.id)} className="space-y-3">
          <textarea
            name="notes"
            rows={4}
            defaultValue={deal.notes ?? ""}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
          />
          <SubmitButton className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
            Save notes
          </SubmitButton>
        </form>
      </Section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? "text-emerald-400" : "text-neutral-100"}`}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">{title}</h2>
      {children}
    </section>
  );
}
