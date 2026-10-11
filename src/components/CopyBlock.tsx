"use client";

import { useState } from "react";

export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
      <pre className="whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
        {text}
      </pre>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300 hover:bg-neutral-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
