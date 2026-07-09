import { ogAlt, ogContentType, ogSize, renderOgImage } from "@/lib/og/template";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Sign in",
    title: "Sign In",
    subtitle: "Connect your OpenStreetMap account to start contributing fountain data.",
  });
}
