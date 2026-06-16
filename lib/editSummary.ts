import type { EditAction } from "./schemas";

// Local YYYY-MM-DD. Safe in the browser (no node deps), mirrors lib/osm todayIso
// so the optimistic client summary matches what the server will write.
export function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

// Human-readable summary of an edit. Shared by the server edit route (real write)
// and the client outbox (optimistic, shown before the write reaches OSM).
export function editSummary(action: EditAction, tagKey: string, today: string): string {
  switch (action) {
    case "confirm":
      return `confirmed · check_date=${today}`;
    case "dog_only":
      return `dog water · not human-potable · dog=yes · check_date=${today}`;
    case "out_of_order":
      return `${tagKey} → disused:${tagKey} · check_date=${today}`;
    case "removed":
      return `${tagKey} → abandoned:${tagKey} · check_date=${today}`;
  }
}
