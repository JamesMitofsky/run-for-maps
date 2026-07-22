<script lang="ts">
  import { CheckCircle, WarningCircle, CloudArrowUp } from "phosphor-svelte";
  import type { SyncState } from "@rosm/core/stores/outbox";

  // Inline per-point sync badge for popups/banners.
  let { state }: { state: SyncState } = $props();
</script>

{#if state === "sent"}
  <span class="inline-flex items-center gap-1 text-green-700">
    <CheckCircle size={13} /> sent to OSM
  </span>
{:else if state === "failed"}
  <span class="inline-flex items-center gap-1 text-red-600">
    <WarningCircle size={13} /> send failed — will retry
  </span>
{:else}
  <span class="inline-flex items-center gap-1 text-amber-600">
    <CloudArrowUp size={13} /> saved · sending…
  </span>
{/if}
