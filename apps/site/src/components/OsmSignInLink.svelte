<script lang="ts">
  import type { Snippet } from "svelte";

  // Shared "Sign in to OSM" affordance: a lbase to the cookie-based OAuth route
  // (/api/osm/auth). Caller controls class/children so it matches each context.
  // Preserves the current page so the OAuth callback can return here.
  let {
    class: className = "",
    onclick,
    children,
  }: { class?: string; onclick?: () => void; children: Snippet } = $props();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const href = pathname
    ? `/api/osm/auth?returnTo=${encodeURIComponent(pathname)}`
    : "/api/osm/auth";
</script>

<a {href} class={className} {onclick}>{@render children()}</a>
