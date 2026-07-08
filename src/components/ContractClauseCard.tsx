"use client";

import { useEffect, useState } from "react";
import { assignableOfferClause } from "@/lib/deal-logic";
import { CopyBlock } from "@/components/CopyBlock";

const STORAGE_KEY = "wholesale:operatorName";

export function ContractClauseCard() {
  const [name, setName] = useState("");

  useEffect(() => {
    // Hydration-safe read of a browser-only store; can't be done in the initializer
    // without mismatching the server-rendered empty value.
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setName(stored);
  }, []);

  function handleChange(value: string) {
    setName(value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Your name or entity
        </label>
        <input
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Jane Doe LLC"
          className="mt-1 w-full max-w-xs rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <p className="text-xs text-neutral-500">
        Put this line on the purchase offer so you keep the legal right to assign the contract.
        Saved on this device so you don&apos;t have to retype it on every deal.
      </p>
      <CopyBlock text={assignableOfferClause(name)} />
    </div>
  );
}
