"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { restoreBackup, type RestoreState } from "@/lib/backup-actions";
import { SubmitButton } from "@/components/SubmitButton";

const CONFIRM_PHRASE = "REPLACE ALL DATA";

export default function BackupPage() {
  const [state, formAction] = useActionState<RestoreState, FormData>(restoreBackup, {});
  const [backup, setBackup] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackup(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  const canSubmit = backup.trim() !== "" && confirmText === CONFIRM_PHRASE;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Back to pipeline
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Backup &amp; Restore</h1>
        <p className="mt-1 text-sm text-neutral-400">
          This app&apos;s database is the only copy of your deals and buyers. Download a backup
          regularly, and keep it somewhere safe.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          Download backup
        </h2>
        <p className="text-sm text-neutral-400">
          Exports every deal, buyer, activity log entry, and outreach record as a single JSON
          file.
        </p>
        <a
          href="/settings/backup/export"
          className="inline-block rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
        >
          Download full backup
        </a>
      </section>

      <section className="space-y-4 rounded-lg border border-red-900/60 bg-red-950/10 p-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-400">
            Restore from backup
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            <strong className="text-red-400">This permanently replaces everything</strong> currently
            in the app — every deal, buyer, activity, and outreach record — with the contents of the
            backup file. There is no undo. Only do this to recover from data loss or move to a fresh
            environment.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Backup file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200 hover:file:bg-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">Or paste backup JSON</label>
            <textarea
              name="backup"
              rows={6}
              value={backup}
              onChange={(e) => setBackup(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Type <code className="rounded bg-neutral-800 px-1 py-0.5 text-red-400">{CONFIRM_PHRASE}</code> to
              confirm
            </label>
            <input
              name="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-red-500 focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
              {state.error}
            </p>
          )}

          {state.success && (
            <p className="rounded-md border border-emerald-800 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              Restored {state.success.deals} deal{state.success.deals === 1 ? "" : "s"},{" "}
              {state.success.buyers} buyer{state.success.buyers === 1 ? "" : "s"},{" "}
              {state.success.activities} activity log entr{state.success.activities === 1 ? "y" : "ies"}, and{" "}
              {state.success.outreach} outreach record{state.success.outreach === 1 ? "" : "s"}.{" "}
              <Link href="/" className="font-medium underline">
                View pipeline
              </Link>
            </p>
          )}

          <SubmitButton
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            pendingLabel="Restoring…"
            disabled={!canSubmit}
          >
            Restore and replace all data
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
