import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createBuyer, deleteBuyer } from "@/lib/actions";
import { BuyerForm } from "@/components/BuyerForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  const buyers = await prisma.buyer.findMany({
    include: { deals: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cash Buyers</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Your list of investors who buy contracts sight-unseen. Build this from investor
          Facebook groups, BiggerPockets Marketplace, and local Meetup.com networks.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <BuyerForm action={createBuyer} submitLabel="Add buyer" />
      </div>

      <div className="space-y-3">
        {buyers.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
            No buyers yet.
          </p>
        )}
        {buyers.map((buyer) => (
          <div
            key={buyer.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-neutral-100">{buyer.name}</p>
              <p className="text-xs text-neutral-500">
                {[buyer.phone, buyer.email].filter(Boolean).join(" · ") || "No contact info"}
              </p>
              {buyer.notes && <p className="mt-1 text-xs text-neutral-500">{buyer.notes}</p>}
              <p className="mt-1 text-[11px] text-neutral-600">
                {buyer.deals.length} deal{buyer.deals.length === 1 ? "" : "s"} assigned
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
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
        ))}
      </div>
    </div>
  );
}
