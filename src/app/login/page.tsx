"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <h1 className="text-lg font-semibold tracking-tight">Wholesale Pipeline</h1>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Password</label>
            <input
              name="password"
              type="password"
              autoFocus
              required
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {state.error && (
            <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
              {state.error}
            </p>
          )}
          <SubmitButton
            pendingLabel="Logging in…"
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Log in
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
