import type { OrderEvent } from "@/types";
import { formatDateTime } from "@/lib/format";

function describe(event: OrderEvent): string {
  switch (event.type) {
    case "created":
      return "created the order";
    case "status_changed":
      return `changed status from ${event.from} to ${event.to}`;
    case "edited":
      return `edited ${event.changes.map((c) => c.field).join(", ")}`;
    case "note_added":
      return `added a note: ${event.note}`;
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-600">No activity yet.</p>;
  }

  return (
    <ol className="space-y-3 border-l pl-4">
      {events.map((e) => (
        <li key={e.id} className="text-sm">
          <p>
            <span className="font-medium">{e.actorName}</span> {describe(e)}
          </p>
          <time dateTime={e.createdAt} className="text-xs text-gray-600">
            {formatDateTime(e.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}