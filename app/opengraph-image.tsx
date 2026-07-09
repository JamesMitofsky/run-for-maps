import { ogAlt, ogContentType, ogSize, renderOgImage } from "@/lib/og/template";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Running for Open-Sourced Maps",
    title: "The DC Water Fountain Map",
    subtitle: "Turn your run into open-map fieldwork. Fix the map from the ground.",
  });
}
