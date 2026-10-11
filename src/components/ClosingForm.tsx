"use client";

import { useActionState } from "react";
import { closeDeal, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function ClosingForm({ dealId, closingDate }: { dealId: string; closingDate: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(closeDeal.bind(null, dealId), {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Closing date</label>
          <input
            name="closingDate"
            type="date"
            defaultValue={closingDate}
            className="mt-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <SubmitButton>Mark closed</SubmitButton>
      </div>
      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
