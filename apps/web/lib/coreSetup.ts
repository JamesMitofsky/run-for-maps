"use client";

// Wire the web platform adapters into @rosm/core exactly once, at client startup.
// Mounted first in the root layout via <CoreBoot /> so the stores are configured
// before any action (outbox hydrate/flush, planner fetch, route archive) runs.
import { configureCore } from "@rosm/core/configure";
import { apiFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { outboxStorage } from "@/lib/idb";
import { kv } from "@/lib/kv";

configureCore({
  api: { apiFetch },
  kv,
  outboxStorage,
  geolocation: { getCurrentPosition },
});
