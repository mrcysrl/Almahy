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
    return (
      <p className="text-sm text-gray-500">No activity yet.</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-gray-200 pl-6">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500"
          />

          <p className="text-sm text-gray-900">
            <span className="font-medium">{event.actorName}</span>{" "}
            {describe(event)}
          </p>

          <time
            dateTime={event.createdAt}
            className="mt-0.5 block text-xs text-gray-500"
          >
            {formatDateTime(event.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}