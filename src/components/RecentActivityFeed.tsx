import Link from "next/link";
import { TYPE_DOT } from "@/components/ActivityTimeline";

export function RecentActivityFeed({
  activities,
}: {
  activities: {
    id: string;
    type: string;
    message: string;
    createdAt: Date;
    deal: { id: string; address: string };
  }[];
}) {
  if (activities.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Recent activity
      </h2>
      <ol className="space-y-2.5">
        {activities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[a.type] ?? "bg-neutral-500"}`}
            />
            <div className="min-w-0">
              <p className="text-neutral-300">
                <Link href={`/deals/${a.deal.id}`} className="text-neutral-100 hover:text-emerald-400">
                  {a.deal.address}
                </Link>{" "}
                — {a.message}
              </p>
              <p className="text-xs text-neutral-600">
                {a.createdAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
