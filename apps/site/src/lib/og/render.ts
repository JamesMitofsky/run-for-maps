import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

/*
 * Shared Open Graph card — an editorial-paper social card styled from the app
 * theme. Ported from the original next/og template to Satori + resvg so it can
 * be rendered at build time (prerender) into a static PNG. Since the site is a
 * single landing page, one card is emitted.
 *
 * Palette + type mirror globals.css (@theme) and the landing page:
 *   paper #f7f2e8 · ink #0c0d0a · ink-dim #57544a · paper-line #d6cdb6 · sky-deep #4fafd4
 *   display = Space Grotesk (uppercase, tight) · body = Inter
 */

export const OG_SIZE = { width: 1200, height: 630 };

const PAPER = "#f7f2e8";
const PAPER_LINE = "#d6cdb6";
const INK = "#0c0d0a";
const INK_DIM = "#57544a";
const SKY_DEEP = "#4fafd4";

// Assets are read once from disk at module load (build time) and reused.
const fontDir = join(process.cwd(), "src", "lib", "og", "fonts");
const readFont = (file: string) => readFileSync(join(fontDir, file));

const fonts = [
  {
    name: "Space Grotesk",
    data: readFont("SpaceGrotesk-700.ttf"),
    weight: 700 as const,
    style: "normal" as const,
  },
  {
    name: "Space Grotesk",
    data: readFont("SpaceGrotesk-500.ttf"),
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    name: "Inter",
    data: readFont("Inter-600.ttf"),
    weight: 600 as const,
    style: "normal" as const,
  },
  {
    name: "Inter",
    data: readFont("Inter-400.ttf"),
    weight: 400 as const,
    style: "normal" as const,
  },
];

// Transparent running-fountain mascot, embedded as an SVG data URI.
const mascot = `data:image/svg+xml;base64,${readFileSync(
  join(process.cwd(), "public", "icons", "icon.svg"),
).toString("base64")}`;

// Faint topographic contour field, echoing the landing hero.
const contours = (() => {
  const stroke = "%230c0d0a";
  const lines = Array.from({ length: 9 }, (_, i) => {
    const o = i * 34;
    const op = (0.1 - i * 0.009).toFixed(3);
    return `%3Cpath d='M-50 ${120 + o} C 200 ${60 + o}, 360 ${220 + o}, 560 ${180 + o} S 920 ${60 + o}, 1260 ${160 + o}' stroke='${stroke}' stroke-width='1.5' opacity='${op}' fill='none'/%3E`;
  }).join("");
  const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'%3E${lines}%3C/svg%3E`;
  return `data:image/svg+xml,${svg}`;
})();

export type OgCopy = {
  title: string;
  highlight?: string;
  subtitle: string;
};

// Split `title` around `highlight` so the matched run can be colored.
function splitTitle(title: string, highlight?: string) {
  if (!highlight) return [{ text: title, accent: false }];
  const at = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (at === -1) return [{ text: title, accent: false }];
  return [
    { text: title.slice(0, at), accent: false },
    { text: title.slice(at, at + highlight.length), accent: true },
    { text: title.slice(at + highlight.length), accent: false },
  ].filter((s) => s.text.length > 0);
}

// Minimal hyperscript for Satori's element tree (no JSX runtime here).
type El = { type: string; props: Record<string, unknown> };
function h(type: string, style: Record<string, unknown>, children?: unknown): El {
  return { type, props: { style, children } };
}

export async function renderOgPng({ title, highlight, subtitle }: OgCopy): Promise<Buffer> {
  const titleParts = splitTitle(title, highlight);

  const children = [
    {
      type: "img",
      props: {
        src: contours,
        width: 1200,
        height: 630,
        style: { position: "absolute", top: 0, left: 0 },
      },
    },
    h("div", {
      position: "absolute",
      inset: 28,
      border: `2px solid ${PAPER_LINE}`,
      borderRadius: 20,
    }),
    h(
      "div",
      { display: "flex", width: "100%", height: "100%", padding: 48, alignItems: "center" },
      [
        h("div", { display: "flex", flexDirection: "column", flex: 1, paddingRight: 32 }, [
          h(
            "div",
            {
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: 92,
              lineHeight: 0.92,
              letterSpacing: -2,
              textTransform: "uppercase",
              color: INK,
            },
            titleParts.map((part) => h("span", { color: part.accent ? SKY_DEEP : INK }, part.text)),
          ),
          h(
            "div",
            { fontSize: 30, lineHeight: 1.35, color: INK_DIM, marginTop: 30, maxWidth: 620 },
            subtitle,
          ),
        ]),
        h(
          "div",
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
          },
          { type: "img", props: { src: mascot, width: 292, height: 360, style: {} } },
        ),
      ],
    ),
  ];

  const tree = h(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      position: "relative",
      backgroundColor: PAPER,
      fontFamily: "Inter",
      padding: 56,
    },
    children,
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    ...OG_SIZE,
    fonts,
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_SIZE.width } }).render().asPng();
  return png;
}
