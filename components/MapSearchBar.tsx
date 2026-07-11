"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

type Props = {
  // Called with the geocoded coordinates of the chosen result.
  onResult: (at: { lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
};

type Hit = { place_id: number; display_name: string; lat: string; lon: string };

// Floating place/address search with a live autocomplete dropdown. Debounces
// Nominatim (OSM) lookups as the user types and hands the chosen match back to
// the parent, which recenters the map. Shared so any map surface can drop in a
// "jump to a place" box.
export default function MapSearchBar({
  onResult,
  placeholder = "Search a place or address",
  className,
}: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced geocode: fires 300ms after the last keystroke. A per-run `stale`
  // flag drops out-of-order responses so a slow earlier query can't clobber a
  // newer one. Queries under 3 chars are skipped — too noisy to geocode.
  useEffect(() => {
    const query = q.trim();
    const stale = { current: false };
    const t = setTimeout(async () => {
      if (query.length < 3) {
        setHits([]);
        setBusy(false);
        return;
      }
      setBusy(true);
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        );
        const j = (await r.json()) as Hit[];
        if (!stale.current) setHits(j);
      } catch {
        if (!stale.current) setHits([]);
      } finally {
        if (!stale.current) setBusy(false);
      }
    }, 300);
    return () => {
      stale.current = true;
      clearTimeout(t);
    };
  }, [q]);

  // Collapse the dropdown when focus leaves the whole widget.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const pick = (h: Hit) => {
    onResult({ lat: Number(h.lat), lon: Number(h.lon) });
    setQ(h.display_name.split(",")[0]);
    setHits([]);
    setOpen(false);
  };

  const showList = open && q.trim().length >= 3 && (busy || hits.length > 0);

  return (
    <div ref={boxRef} className={`relative ${className ?? ""}`}>
      <div className="border-paper-line bg-paper/90 flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 shadow-sm backdrop-blur">
        {busy ? (
          <CircleNotchIcon size={14} className="text-ink-dim animate-spin" />
        ) : (
          <MagnifyingGlassIcon size={14} className="text-ink-dim" />
        )}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) pick(hits[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="text-ink placeholder:text-ink-dim w-40 bg-transparent text-xs font-semibold outline-none md:w-52"
        />
      </div>

      {showList && (
        <ul className="border-paper-line bg-paper/95 absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-sm border shadow-md backdrop-blur">
          {hits.length === 0 && busy ? (
            <li className="text-ink-dim px-2.5 py-2 text-[11px]">Searching…</li>
          ) : (
            hits.map((h) => (
              <li key={h.place_id}>
                <button
                  type="button"
                  onClick={() => pick(h)}
                  className="text-ink hover:bg-sky-deep/10 block w-full truncate px-2.5 py-1.5 text-left text-xs transition"
                  title={h.display_name}
                >
                  {h.display_name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
