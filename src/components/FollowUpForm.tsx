"use client";

import { useActionState } from "react";
import { updateFollowUp, type ActionState } from "@/lib/actions";
import { followUpStatusLabel } from "@/lib/deal-logic";
import { SubmitButton } from "@/components/SubmitButton";

export function FollowUpForm({
  dealId,
  followUpDate,
  followUpNote,
}: {
  dealId: string;
  followUpDate: string;
  followUpNote: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateFollowUp.bind(null, dealId),
    {}
  );
  const status = followUpDate ? followUpStatusLabel(new Date(followUpDate)) : null;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium text-neutral-300">Follow up on</label>
        <input
          name="followUpDate"
          type="date"
          defaultValue={followUpDate}
          className="mt-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 min-w-[12rem]">
        <label className="block text-sm font-medium text-neutral-300">Reminder note</label>
        <input
          name="followUpNote"
          defaultValue={followUpNote}
          placeholder="e.g. call about inspection report"
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      {status && (
        <span
          className={`mb-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            status.urgent ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"
          }`}
        >
          {status.label}
        </span>
      )}
      <SubmitButton className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
        Save
      </SubmitButton>
      {state.error && (
        <p className="w-full rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
