import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBuyer } from "@/lib/actions";
import { BuyerForm } from "@/components/BuyerForm";

export const dynamic = "force-dynamic";

export default async function EditBuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyer = await prisma.buyer.findUnique({ where: { id } });
  if (!buyer) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/buyers" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back to buyers
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit Buyer</h1>

      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <BuyerForm
          action={updateBuyer.bind(null, buyer.id)}
          submitLabel="Save changes"
          defaultValues={buyer}
        />
      </div>
    </div>
  );
}
