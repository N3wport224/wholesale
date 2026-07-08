export const TYPE_DOT: Record<string, string> = {
  CREATED: "bg-neutral-500",
  UPDATED: "bg-neutral-500",
  STATUS_CHANGE: "bg-amber-400",
  CONTRACT: "bg-blue-400",
  BUYER_ASSIGNED: "bg-purple-400",
  CLOSED: "bg-emerald-400",
  OUTREACH: "bg-sky-400",
};

export function ActivityTimeline({
  activities,
}: {
  activities: { id: string; type: string; message: string; createdAt: Date }[];
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-neutral-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-3 text-sm">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[activity.type] ?? "bg-neutral-500"}`}
          />
          <div className="min-w-0">
            <p className="text-neutral-300">{activity.message}</p>
            <p className="text-xs text-neutral-600">
              {activity.createdAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
