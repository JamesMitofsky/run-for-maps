import { ogAlt, ogContentType, ogSize, renderOgImage } from "@/lib/og/template";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Running for Open-Sourced Maps",
    title: "The DC Water Fountain Map",
    subtitle: "Data sourced by — and for — runners. The definitive map of public fountains in DC.",
  });
}
