"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import NativeEntryRedirect from "@/components/NativeEntryRedirect";
import {
  ArrowRightIcon,
  MapTrifoldIcon,
  GlobeHemisphereWestIcon,
} from "@phosphor-icons/react";

const DemoRunMap = dynamic(() => import("@/components/DemoRunMap"), { ssr: false });

/* ------------------------------------------------------------------ */
/* Decorative topographic contour field.                              */
/* ------------------------------------------------------------------ */
function Contours({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const o = i * 26;
        return (
          <path
            key={i}
            d={`M-50 ${120 + o}
                C 200 ${60 + o}, 360 ${220 + o}, 560 ${180 + o}
                S 920 ${60 + o}, 1260 ${160 + o}`}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.5 - i * 0.04}
          />
        );
      })}
      {Array.from({ length: 7 }).map((_, i) => {
        const o = i * 30;
        return (
          <path
            key={`b-${i}`}
            d={`M-50 ${420 + o}
                C 180 ${360 + o}, 420 ${520 + o}, 640 ${440 + o}
                S 980 ${360 + o}, 1260 ${480 + o}`}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.42 - i * 0.05}
          />
        );
      })}
    </svg>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

/* Tiny mono corner label, as in the reference layouts. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-ink-dim">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className="paper-grain relative bg-paper font-body text-ink">
      <NativeEntryRedirect />
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-paper-line bg-paper/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-5">
            <span className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon.svg" alt="" className="h-7 w-7" />
              <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">ROSM</span>
            </span>
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink-dim sm:inline">
              Running for Open-Sourced Maps
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/public-fountains"
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ink px-3 py-2 text-sm font-bold text-ink transition hover:bg-ink hover:text-paper sm:px-5"
            >
              <MapTrifoldIcon size={16} weight="bold" />
              <span className="hidden sm:inline">Fountains near you</span>
              <span className="sm:hidden">Fountains</span>
            </Link>
            <Link
              href="/plan"
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ink bg-ink px-3 py-2 text-sm font-bold text-paper transition hover:bg-transparent hover:text-ink sm:px-5"
            >
              Plan a route
              <ArrowRightIcon size={16} weight="bold" className="hidden transition-transform group-hover:translate-x-1 sm:inline" />
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <Contours className="pointer-events-none absolute inset-0 h-full w-full text-ink/[0.06]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 md:pb-24 md:pt-20">
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="max-w-5xl font-display text-[clamp(2.6rem,8.5vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tight"
          >
            Runner-sourced
            <br />
            <span className="text-sky-deep">public maps</span>
          </motion.h1>

          <div className="mt-10">
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
              className="max-w-xl text-lg leading-relaxed text-ink-dim"
            >
              Plan your runs to crowdsource public map data
            </motion.p>
          </div>

          {/* Sample-route label, sitting tightly above the map plate. */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.24 }}
            className="mt-14 flex items-center justify-between gap-4 px-1 pb-2"
          >
            <Label>Washington DC</Label>
            <Label>11 fountains</Label>
          </motion.div>

          {/* Sky panel — an interactive demo run on a real sample route,
              framed like a print plate. All edits stay in local state. */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.28 }}
            className="relative overflow-hidden rounded-xl border border-ink/10 bg-sky"
          >
            <div className="relative isolate z-0 h-[clamp(340px,48vw,560px)] w-full">
              <DemoRunMap />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MANIFESTO SPLIT */}
      <section className="border-t border-paper-line bg-paper-deep">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.05] tracking-tight">
              Keeping map data <span className="text-sky-deep">public</span> is
              important
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-dim">
              Crowdsourced map data degrades over time. Places like drinking
              fountains, benches, and similar nodes (which Apple and Google
              don&apos;t even track, data sovereignty aside) are often tagged once
              and never re-verified.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-dim">
              This app aims to solve the verification problem by routing runs past
              these unverified points so their real-world state can be observed
              and recorded into the Open Street Maps platform (the crowd-sourced,
              non-profit alternative to Google Maps).
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex self-start">
            <div className="flex gap-4 rounded-2xl border border-paper-line bg-paper px-5 py-8">
              <GlobeHemisphereWestIcon size={28} weight="bold" className="mt-0.5 shrink-0 text-sky-deep" />
              <p className="text-lg leading-relaxed text-ink-dim">
                Right now, the focus is on documenting fountains as a public
                amenity, and once this proof of concept is locked down, branching
                out to recording and maintaining data for other public amenities.
                Things like public restrooms, picnic tables, parks, etc.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW TO CONTRIBUTE */}
      <section id="how" className="border-t border-paper-line">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-[clamp(2rem,5.5vw,3.6rem)] font-bold uppercase leading-tight tracking-tight">
              How to contribute
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-dim">
              If you have feedback on your experience using ROSM or want to
              contribute to the code, shoot me a message at{" "}
              <a href="mailto:james@btv.dev" className="text-sky-deep underline">
                james@btv.dev
              </a>
              .
            </p>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-paper-line">
        <Contours className="pointer-events-none absolute inset-0 h-full w-full text-ink/[0.05]" />
        <div className="relative mx-auto max-w-5xl px-5 py-24 text-center md:py-32">
          <motion.div {...fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/plan"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-9 py-4 text-lg font-bold text-paper transition hover:gap-3"
            >
              Plan a route
              <ArrowRightIcon size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-paper-line">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-5 py-8 text-sm text-ink-dim">
          <span>
            Made with <span className="text-sky-deep">♥</span> by{" "}
            <a
              href="https://btv.dev/about"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-sky-deep/50 underline-offset-4 hover:decoration-sky-deep"
            >
              James Mitofsky
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
