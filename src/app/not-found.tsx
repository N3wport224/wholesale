import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-neutral-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100">
        We couldn&apos;t find that
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-400">
        The deal or buyer you&apos;re looking for may have been deleted, or the link is off.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
      >
        Back to pipeline
      </Link>
    </div>
  );
}
