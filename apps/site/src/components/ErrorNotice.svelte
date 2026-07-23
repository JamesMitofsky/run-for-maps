<script lang="ts">
  import type { Snippet } from "svelte";

  // Inline error box with an optional retry action. `tone` matches the surface:
  // "dark" for panels over the dark surface background (planner), "light" for
  // light panels (fountain browser).
  let {
    message,
    tone = "dark",
    onRetry,
    retrying = false,
    retryLabel = "Try again",
    retryingLabel = "Trying…",
    children,
  }: {
    message: string;
    tone?: "dark" | "light";
    onRetry?: () => void;
    retrying?: boolean;
    retryLabel?: string;
    retryingLabel?: string;
    children?: Snippet;
  } = $props();

  const text = $derived(tone === "dark" ? "text-red-300" : "text-red-700");
  const retry = $derived(
    tone === "dark" ? "text-red-200 hover:bg-red-500/20" : "text-red-600 hover:bg-red-500/10",
  );
</script>

<div
  class="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm {text}"
>
  <span>{message}</span>
  {@render children?.()}
  {#if onRetry}
    <button
      type="button"
      onclick={onRetry}
      disabled={retrying}
      class="self-start rounded-md border border-red-500/40 px-2 py-1 text-xs font-medium disabled:opacity-50 {retry}"
    >
      {retrying ? retryingLabel : retryLabel}
    </button>
  {/if}
</div>
