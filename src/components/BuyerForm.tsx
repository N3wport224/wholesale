"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

type BuyerFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

type BuyerFormValues = {
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  targetStates: string | null;
};

export function BuyerForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: BuyerFormAction;
  submitLabel: string;
  defaultValues?: BuyerFormValues;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-neutral-300">Name</label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">Phone</label>
        <input
          name="phone"
          defaultValue={defaultValues?.phone ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-neutral-300">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2 border-t border-neutral-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Buy box</p>
        <p className="mt-1 text-xs text-neutral-500">
          Used to suggest this buyer for deals that fit their price range and target states.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Min contract price <span className="text-neutral-600">(optional)</span>
        </label>
        <input
          name="minPrice"
          type="number"
          min={0}
          defaultValue={defaultValues?.minPrice ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Max contract price <span className="text-neutral-600">(optional)</span>
        </label>
        <input
          name="maxPrice"
          type="number"
          min={0}
          defaultValue={defaultValues?.maxPrice ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-neutral-300">
          Target states <span className="text-neutral-600">(comma-separated, e.g. TX, OK — blank means any)</span>
        </label>
        <input
          name="targetStates"
          defaultValue={defaultValues?.targetStates ?? undefined}
          placeholder="TX, OK"
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-neutral-300">
          Notes <span className="text-neutral-600">(anything else — closing speed, proof of funds, etc.)</span>
        </label>
        <input
          name="notes"
          defaultValue={defaultValues?.notes ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      {state.error && (
        <p className="sm:col-span-2 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
