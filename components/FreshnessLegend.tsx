import { lastCheckedMs } from "@/lib/checkDate";

// Freshness of a fountain's last on-the-ground verification. Never-checked folds
// into "very stale" — the point that most needs a runner to visit.
// `out_of_service` is orthogonal to freshness: it's only assigned to points
// confirmed broken *recently* (checked <1y), which a runner can safely skip.
// An out-of-service point that's gone stale keeps its freshness color — it's as
// worth revisiting as any, since it may well be back in service by now.
export type Bucket = "fresh" | "stale" | "very_stale" | "out_of_service";

export const BUCKET_COLOR: Record<Bucket, string> = {
  fresh: "#10b981", // emerald
  stale: "#f59e0b", // amber
  very_stale: "#f43f5e", // rose
  out_of_service: "#9ca3af", // gray
};

// The out-of-service swatch/markers render dimmed — a recently-confirmed dead
// point is deprioritized, not a revisit target.
export const BUCKET_OPACITY: Partial<Record<Bucket, number>> = {
  out_of_service: 0.7,
};

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const FRESH_CUTOFF = 12 * MONTH_MS; // checked within a year
const STALE_CUTOFF = 36 * MONTH_MS; // checked within three years

// Grade a point by how long ago it was last verified. `nowMs` is passed in so
// the caller owns the clock (pure across re-renders / testable).
export function bucketOf(tags: Record<string, string>, nowMs: number): Bucket {
  const checked = lastCheckedMs(tags);
  if (checked == null) return "very_stale";
  const age = nowMs - checked;
  if (age <= FRESH_CUTOFF) return "fresh";
  if (age <= STALE_CUTOFF) return "stale";
  return "very_stale";
}

// Final marker bucket, folding in service state. A point recently confirmed
// out of service (checked <1y) becomes `out_of_service`; otherwise it grades on
// freshness alone — stale/never-checked points stay revisit targets even when
// last known out of service.
export function markerBucketOf(
  tags: Record<string, string>,
  outOfService: boolean,
  nowMs: number,
): Bucket {
  const fresh = bucketOf(tags, nowMs);
  if (outOfService && fresh === "fresh") return "out_of_service";
  return fresh;
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  fresh: "Checked <1y ago",
  stale: "Checked 1–3y ago",
  very_stale: "Checked >3y ago",
  out_of_service: "Out of service",
};

const ORDER = ["fresh", "stale", "very_stale", "out_of_service"] as const;

// Legend swatches with per-state counts (numbers kept low-emphasis).
export default function FreshnessLegend({
  counts,
  className = "",
}: {
  counts: Record<Bucket, number>;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${className}`}>
      {ORDER.map((b) => (
        <span key={b} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: BUCKET_COLOR[b], opacity: BUCKET_OPACITY[b] ?? 1 }}
          />
          {BUCKET_LABEL[b]}
          <span className="text-ink-dim tabular-nums">{counts[b]}</span>
        </span>
      ))}
    </div>
  );
}
