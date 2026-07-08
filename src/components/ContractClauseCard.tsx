"use client";

import { useState } from "react";
import { assignableOfferClause } from "@/lib/deal-logic";
import { CopyBlock } from "@/components/CopyBlock";

export function ContractClauseCard() {
  const [name, setName] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Your name or entity
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe LLC"
          className="mt-1 w-full max-w-xs rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <p className="text-xs text-neutral-500">
        Put this line on the purchase offer so you keep the legal right to assign the contract.
      </p>
      <CopyBlock text={assignableOfferClause(name)} />
    </div>
  );
}
