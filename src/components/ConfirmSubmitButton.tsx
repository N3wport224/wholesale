"use client";

import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({
  children,
  pendingLabel,
  confirmMessage,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  confirmMessage: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className={
        className ??
        "rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
      }
    >
      {pending ? pendingLabel ?? "Working…" : children}
    </button>
  );
}
