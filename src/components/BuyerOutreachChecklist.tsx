"use client";

import { useActionState } from "react";
import { updateBuyerOutreach, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

type Buyer = { id: string; name: string };

export function BuyerOutreachChecklist({
  dealId,
  buyers,
  sentBuyerIds,
}: {
  dealId: string;
  buyers: Buyer[];
  sentBuyerIds: string[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBuyerOutreach.bind(null, dealId),
    {}
  );
  const sentSet = new Set(sentBuyerIds);

  if (buyers.length === 0) return null;

  return (
    <form action={formAction} className="space-y-3 border-t border-neutral-800 pt-4">
      <div>
        <p className="text-sm font-medium text-neutral-300">Buyers contacted</p>
        <p className="text-xs text-neutral-500">
          Check off who you&apos;ve actually sent this deal to — separate from who it ends up
          assigned to.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {buyers.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="buyerIds"
              value={b.id}
              defaultChecked={sentSet.has(b.id)}
              className="rounded border-neutral-700 bg-neutral-900"
            />
            {b.name}
          </label>
        ))}
      </div>
      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <SubmitButton className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
        Save outreach list
      </SubmitButton>
    </form>
  );
}
