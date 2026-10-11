"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { importDeals, type ImportResult } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const SAMPLE = `Address,City,State,Zip,Source,Purchase Price,Estimated Value,Rent Comp,Notes
412 Birchwood Ave,Tulsa,OK,74106,GSAAuctions.gov,6500,78000,950,Vacant 2 years`;

export default function ImportDealsPage() {
  const [state, formAction] = useActionState<ImportResult, FormData>(importDeals, {});
  const [csv, setCsv] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back to pipeline
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Import Deals</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Bring in a list of leads from a spreadsheet. Upload a CSV file or paste the rows below.
        Required columns: Address, City, State, Zip, Purchase Price, Estimated Value. Optional:
        Source, Rent Comp, Notes.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300">CSV file</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200 hover:file:bg-neutral-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">
            Or paste CSV rows
          </label>
          <textarea
            name="csv"
            rows={10}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={SAMPLE}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCsv(SAMPLE)}
            className="mt-1 text-xs text-neutral-500 hover:text-neutral-300"
          >
            Fill in a sample row
          </button>
        </div>

        {state.error && (
          <p className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
            {state.error}
          </p>
        )}

        {state.summary && (
          <div className="space-y-2 rounded-md border border-emerald-800 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <p>
              Imported {state.summary.created} deal{state.summary.created === 1 ? "" : "s"}.
              {state.summary.skipped.length > 0 &&
                ` Skipped ${state.summary.skipped.length} row${state.summary.skipped.length === 1 ? "" : "s"}.`}
            </p>
            {state.summary.skipped.length > 0 && (
              <ul className="space-y-1 text-xs text-amber-300">
                {state.summary.skipped.map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
            {state.summary.created > 0 && (
              <Link href="/" className="inline-block text-xs font-medium text-emerald-300 underline">
                View pipeline
              </Link>
            )}
          </div>
        )}

        <SubmitButton>Import deals</SubmitButton>
      </form>
    </div>
  );
}
