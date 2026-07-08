import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LABELS,
  DealStatus,
  formatCurrency,
  inspectionStatusLabel,
  matchesCriteria,
  spread,
} from "@/lib/deal-logic";
import { markDealDead, deleteDeal, updateDealNotes } from "@/lib/actions";
import { ContractClauseCard } from "@/components/ContractClauseCard";
import { ContractTermsForm } from "@/components/ContractTermsForm";
import { MarketingBlurbCard } from "@/components/MarketingBlurbCard";
import { ClosingForm } from "@/components/ClosingForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const { id } = await params;
  const { duplicate } = await searchParams;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!deal) notFound();

  const buyers = await prisma.buyer.findMany({ orderBy: { name: "asc" } });
  const isMatch = matchesCriteria(deal.purchasePrice, deal.estimatedValue);
  const gap = spread(deal.purchasePrice, deal.estimatedValue);
  const inspection =
    deal.status === "UNDER_CONTRACT" ? inspectionStatusLabel(deal.contractDate, deal.inspectionDays) : null;

  return (
    <div className="max-w-3xl space-y-8">
      {duplicate === "1" && (
        <div className="rounded-md border border-amber-800 bg-amber-500/10 p-3 text-sm text-amber-300">
          Heads up — a deal at this address already exists in your pipeline. Saved anyway; check
          you&apos;re not duplicating work.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{deal.address}</h1>
            {isMatch && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Match
              </span>
            )}
            {inspection && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  inspection.urgent
                    ? "bg-red-500/15 text-red-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}
              >
                {inspection.label}
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
          <Link
            href={`/deals/${deal.id}/edit`}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Edit
          </Link>
          {deal.status !== "DEAD" && deal.status !== "CLOSED" && (
            <form action={markDealDead.bind(null, deal.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Mark ${deal.address} dead? You can revive it later by re-locking it under contract.`}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Mark dead
              </ConfirmSubmitButton>
            </form>
          )}
          <form action={deleteDeal.bind(null, deal.id)}>
            <ConfirmSubmitButton
              confirmMessage={`Delete ${deal.address}? This can't be undone.`}
            >
              Delete
            </ConfirmSubmitButton>
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
        {deal.status === "CLOSED" ? (
          <p className="text-sm text-neutral-300">
            Locked under contract on {toInputDate(deal.contractDate) || "—"}
            {deal.earnestMoney ? ` — ${formatCurrency(deal.earnestMoney)} earnest money` : ""}
            {deal.inspectionDays ? `, ${deal.inspectionDays}-day inspection.` : "."}
          </p>
        ) : (
          <>
            <ContractClauseCard />
            <ContractTermsForm
              dealId={deal.id}
              earnestMoney={deal.earnestMoney}
              inspectionDays={deal.inspectionDays}
              contractDate={toInputDate(deal.contractDate)}
            />
          </>
        )}
      </Section>

      <Section title="Step 4 — Find a cash buyer">
        <p className="text-sm text-neutral-400">
          Post the deal to investor Facebook groups, BiggerPockets Marketplace, or local
          Meetup.com networks, then record who you assigned it to.
        </p>
        {deal.status === "CLOSED" ? (
          <p className="text-sm text-neutral-300">
            {deal.buyerId
              ? `Assigned to ${buyers.find((b) => b.id === deal.buyerId)?.name ?? "a buyer"} for ${formatCurrency(deal.assignmentFee)}.`
              : "No buyer was recorded before this deal closed."}
          </p>
        ) : (
          <MarketingBlurbCard
            key={`${deal.buyerId ?? "none"}-${deal.assignmentFee ?? "0"}`}
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
        )}
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
          <ClosingForm dealId={deal.id} closingDate={toInputDate(deal.closingDate)} />
        )}
      </Section>

      <Section title="Activity">
        <ActivityTimeline activities={deal.activities} />
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
