"use client";

import { useRouter } from "next/navigation";

interface EventSelectorProps {
  events: { id: string; title: string }[];
  selectedEventId?: string;
}

export default function EventSelector({ events, selectedEventId }: EventSelectorProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-md">
      <label htmlFor="event-select" className="block text-sm font-semibold text-neutral-300 mb-2">
        Select Hackathon Event
      </label>
      <select
        id="event-select"
        value={selectedEventId || ""}
        onChange={(e) => {
          const id = e.target.value;
          if (id) {
            router.push(`/dashboard/organizer/evaluations?eventId=${id}`);
          } else {
            router.push("/dashboard/organizer/evaluations");
          }
        }}
        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-lg h-10 px-3 outline-none focus:border-violet-600 transition-colors"
      >
        <option value="">-- Choose an Event --</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title}
          </option>
        ))}
      </select>
    </div>
  );
}
