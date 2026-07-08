"use client";

import { createDeal } from "@/lib/actions";
import { CRITERIA, formatCurrency } from "@/lib/deal-logic";
import { DealForm } from "@/components/DealForm";

export default function NewDealPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">New Deal</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Step 1: where you found it. Step 2: does it clear the filter — purchase price{" "}
        {formatCurrency(CRITERIA.minPurchasePrice)}–{formatCurrency(CRITERIA.maxPurchasePrice)}{" "}
        with a true value of {formatCurrency(CRITERIA.minEstimatedValue)}+.
      </p>

      <DealForm action={createDeal} submitLabel="Save deal" />
    </div>
  );
}
