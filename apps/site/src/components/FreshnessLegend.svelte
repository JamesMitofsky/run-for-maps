<script lang="ts">
  import { BUCKET_COLOR, BUCKET_LABEL, BUCKET_ORDER } from "@/lib/freshness";

  // Legend pills: each freshness state's color fills its own pill.
  let { class: className = "" }: { class?: string } = $props();
</script>

<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium {className}">
  <span class="text-ink-dim tracking-wide uppercase">Last Checked</span>
  {#each BUCKET_ORDER as b (b)}
    <span class="text-ink rounded-full px-2 py-0.5" style="background: {BUCKET_COLOR[b]}1f">
      {BUCKET_LABEL[b]}
    </span>
  {/each}
</div>
