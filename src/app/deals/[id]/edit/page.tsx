import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateDeal } from "@/lib/actions";
import { DealForm } from "@/components/DealForm";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) notFound();

  return (
    <div className="max-w-2xl">
      <Link href={`/deals/${deal.id}`} className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back to deal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit Deal</h1>
      <p className="mt-1 text-sm text-neutral-400">{deal.address}</p>

      <DealForm
        action={updateDeal.bind(null, deal.id)}
        submitLabel="Save changes"
        defaultValues={{
          address: deal.address,
          city: deal.city,
          state: deal.state,
          zip: deal.zip,
          sourceSite: deal.sourceSite,
          purchasePrice: deal.purchasePrice,
          estimatedValue: deal.estimatedValue,
          rentComp: deal.rentComp,
          notes: deal.notes,
        }}
      />
    </div>
  );
}
