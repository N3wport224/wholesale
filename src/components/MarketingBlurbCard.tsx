"use client";

import { useActionState, useState } from "react";
import { assignBuyerToDeal, type ActionState } from "@/lib/actions";
import { buyerMatchesDeal, formatCurrency, marketingBlurb, suggestedAssignmentFee } from "@/lib/deal-logic";
import { CopyBlock } from "@/components/CopyBlock";
import { SubmitButton } from "@/components/SubmitButton";

type Buyer = {
  id: string;
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
  targetStates: string | null;
};

type Props = {
  dealId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchasePrice: number;
  estimatedValue: number;
  rentComp: number | null;
  buyers: Buyer[];
  currentBuyerId: string | null;
  currentAssignmentFee: number | null;
};

export function MarketingBlurbCard(props: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    assignBuyerToDeal.bind(null, props.dealId),
    {}
  );
  const suggested = suggestedAssignmentFee(props.purchasePrice, props.estimatedValue);
  const [assignmentFee, setAssignmentFee] = useState(
    (props.currentAssignmentFee ?? suggested.low).toString()
  );
  const [buyerId, setBuyerId] = useState(props.currentBuyerId ?? "");

  const fee = assignmentFee === "" ? suggested.low : Number(assignmentFee);
  const matchedBuyerIds = new Set(
    props.buyers
      .filter((b) => buyerMatchesDeal(b, { purchasePrice: props.purchasePrice, assignmentFee: fee, state: props.state }))
      .map((b) => b.id)
  );

  const blurb = marketingBlurb({
    address: props.address,
    city: props.city,
    state: props.state,
    zip: props.zip,
    purchasePrice: props.purchasePrice,
    estimatedValue: props.estimatedValue,
    rentComp: props.rentComp,
    assignmentFee: assignmentFee === "" ? suggested.low : Number(assignmentFee),
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Cash buyer</label>
          <select
            name="buyerId"
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Not assigned yet</option>
            {props.buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {matchedBuyerIds.has(b.id) ? `${b.name} — buy box match` : b.name}
              </option>
            ))}
          </select>
          {props.buyers.length === 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              No buyers yet — add one on the Cash Buyers page.
            </p>
          )}
          {props.buyers.length > 0 && matchedBuyerIds.size > 0 && (
            <p className="mt-1 text-xs text-emerald-400">
              {matchedBuyerIds.size} buyer{matchedBuyerIds.size === 1 ? "" : "s"} match this
              price and state based on their buy box.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">
            Assignment fee (markup over your contract price)
          </label>
          <input
            name="assignmentFee"
            type="number"
            min={0}
            value={assignmentFee}
            onChange={(e) => setAssignmentFee(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Suggested range: {formatCurrency(suggested.low)}–{formatCurrency(suggested.high)}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-neutral-300">
          Marketing blurb — post to investor Facebook groups, BiggerPockets Marketplace, or a
          local Meetup network
        </p>
        <CopyBlock text={blurb} />
      </div>

      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{state.error}</p>
      )}

      <SubmitButton>Save & move to Marketing</SubmitButton>
    </form>
  );
}
