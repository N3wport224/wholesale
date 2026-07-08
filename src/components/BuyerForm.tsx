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
      <div>
        <label className="block text-sm font-medium text-neutral-300">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Notes <span className="text-neutral-600">(buy box, markets, price range)</span>
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
