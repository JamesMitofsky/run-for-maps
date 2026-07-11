import { useCallback, useMemo } from "react";
import type { EditAction, EditExtras } from "@rosm/core/schemas";
import { useOutbox } from "@rosm/core/stores/outbox";
import { celebratePoint } from "../ports/confetti";
import { hapticSuccess } from "../ports/haptics";
import type { PointEdit } from "../components/PointSheet";

// Direct OSM edits made from a map, outside a run. Backed by the offline
// outbox: saved on-device first, sent to OSM in the background, batched into
// one changeset. The mobile mirror of the web useOsmEdits hook.
export function useOsmEdits({ tagKey }: { tagKey: string }) {
  const outboxItems = useOutbox((s) => s.items);

  // Latest queued edit per node, for the marker color/label + sheet feedback.
  const edits = useMemo(() => {
    const m: Record<number, PointEdit> = {};
    for (const it of outboxItems) {
      m[it.nodeId] = {
        status: it.action,
        summary: it.summary,
        syncState: it.syncState,
        changesetUrl: it.changesetUrl,
        extras: it.extras,
      };
    }
    return m;
  }, [outboxItems]);

  // Update a point straight from the map. Offline-first: queued on-device and
  // celebrated immediately, then sent to OSM in the background. Stable identity
  // so marker memos can list it as an honest dependency.
  const updatePoint = useCallback(
    (nodeId: number, action: EditAction, name?: string, extras?: EditExtras) => {
      useOutbox.getState().enqueue({ nodeId, action, tagKey, name, extras });
      celebratePoint();
      hapticSuccess();
      useOutbox.getState().flush();
    },
    [tagKey],
  );

  return { edits, updatePoint };
}

export type OsmEdits = ReturnType<typeof useOsmEdits>;
