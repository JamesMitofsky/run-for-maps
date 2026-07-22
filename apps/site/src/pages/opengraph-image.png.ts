import type { APIRoute } from "astro";
import { renderOgPng } from "@/lib/og/render";

// Static social card, rendered once at build time (fonts read from disk here,
// no serverless cold-start). The landing page is the single public page.
export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    title: "The DC Water Fountain Map",
    highlight: "Water Fountain",
    subtitle: "Map data sourced by runners",
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
