"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/actions";
import { CRITERIA, SOURCE_SITES, formatCurrency, matchesCriteria, spread } from "@/lib/deal-logic";
import { SubmitButton } from "@/components/SubmitButton";

type DealFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

type DealFormValues = {
  address: string;
  city: string;
  state: string;
  zip: string;
  sourceSite: string;
  purchasePrice: number;
  estimatedValue: number;
  rentComp: number | null;
  notes: string | null;
};

export function DealForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: DealFormAction;
  submitLabel: string;
  defaultValues?: DealFormValues;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [purchasePrice, setPurchasePrice] = useState(defaultValues?.purchasePrice?.toString() ?? "");
  const [estimatedValue, setEstimatedValue] = useState(defaultValues?.estimatedValue?.toString() ?? "");

  const purchase = Number(purchasePrice) || 0;
  const value = Number(estimatedValue) || 0;
  const isMatch = purchasePrice !== "" && estimatedValue !== "" && matchesCriteria(purchase, value);
  const gap = purchase && value ? spread(purchase, value) : 0;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-300">Address</label>
          <input
            name="address"
            required
            defaultValue={defaultValues?.address}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            placeholder="123 Main St"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">City</label>
          <input
            name="city"
            required
            defaultValue={defaultValues?.city}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">State</label>
            <input
              name="state"
              required
              maxLength={2}
              defaultValue={defaultValues?.state}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 uppercase focus:border-emerald-500 focus:outline-none"
              placeholder="TX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Zip</label>
            <input
              name="zip"
              required
              defaultValue={defaultValues?.zip}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300">Source site</label>
        <select
          name="sourceSite"
          defaultValue={defaultValues?.sourceSite ?? SOURCE_SITES[0]}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        >
          {SOURCE_SITES.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Purchase price</label>
          <input
            name="purchasePrice"
            type="number"
            min={0}
            required
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            placeholder="7500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Estimated value</label>
          <input
            name="estimatedValue"
            type="number"
            min={0}
            required
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            placeholder="85000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">
            Rent comp <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            name="rentComp"
            type="number"
            min={0}
            defaultValue={defaultValues?.rentComp ?? undefined}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            placeholder="1200"
          />
        </div>
      </div>

      {purchasePrice !== "" && estimatedValue !== "" && (
        <div
          className={`rounded-md border p-3 text-sm ${
            isMatch
              ? "border-emerald-800 bg-emerald-500/10 text-emerald-300"
              : "border-amber-800 bg-amber-500/10 text-amber-300"
          }`}
        >
          {isMatch
            ? `Matches the filter. Spread: ${formatCurrency(gap)}.`
            : `Outside the target range (purchase ${formatCurrency(CRITERIA.minPurchasePrice)}–${formatCurrency(
                CRITERIA.maxPurchasePrice
              )}, value ${formatCurrency(CRITERIA.minEstimatedValue)}+). You can still save it.`}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Notes <span className="text-neutral-600">(optional)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? undefined}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{state.error}</p>
      )}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
