"use client";

import { useActionState } from "react";
import { updateContractTerms, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function ContractTermsForm({
  dealId,
  earnestMoney,
  inspectionDays,
  contractDate,
}: {
  dealId: string;
  earnestMoney: number | null;
  inspectionDays: number | null;
  contractDate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateContractTerms.bind(null, dealId),
    {}
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 border-t border-neutral-800 pt-4 sm:grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Earnest money ($500–$1,000)
        </label>
        <input
          name="earnestMoney"
          type="number"
          min={0}
          defaultValue={earnestMoney ?? 500}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">Inspection period (days)</label>
        <input
          name="inspectionDays"
          type="number"
          min={1}
          max={120}
          defaultValue={inspectionDays ?? 21}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">Contract date</label>
        <input
          name="contractDate"
          type="date"
          defaultValue={contractDate}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      {state.error && (
        <p className="sm:col-span-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-3">
        <SubmitButton>Save & move to Under Contract</SubmitButton>
      </div>
    </form>
  );
}
