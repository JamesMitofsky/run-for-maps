<script lang="ts">
  let { size = 16, class: className = "" }: { size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={className}>
  <path
    d="M10 9.5 V5 C10 3.3 11.3 2 13 2 C14.7 2 15.5 3.2 15.5 4.5 V5"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    fill="none"
  />
  <path
    d="M16 6.5 C16 6.5 14.8 8 14.8 8.8 C14.8 9.5 15.3 10 16 10 C16.7 10 17.2 9.5 17.2 8.8 C17.2 8 16 6.5 16 6.5 Z"
  />
  <path d="M4 9.5 H20 C20 14.2 16.2 16 12 16 C7.8 16 4 14.2 4 9.5 Z" />
  <path d="M9.5 16 H14.5 V18.5 H7 V21 H17 V18.5 H14.5 V16 Z" />
</svg>
