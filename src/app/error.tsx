"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-red-500">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100">
        Unexpected error
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-400">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
      >
        Try again
      </button>
    </div>
  );
}
