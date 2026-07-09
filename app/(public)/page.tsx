"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import FreshnessLegend, { type Bucket } from "@/components/FreshnessLegend";
import HomeRunCard from "@/components/HomeRunCard";
import NativeEntryRedirect from "@/components/NativeEntryRedirect";
import SiteNav from "@/components/SiteNav";
import { HeartIcon } from "@phosphor-icons/react";

const DemoRunMap = dynamic(() => import("@/components/DemoRunMap"), { ssr: false });
const LiveFountainMap = dynamic(() => import("@/components/LiveFountainMap"), { ssr: false });

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
    <span className="text-ink-dim font-mono text-[0.65rem] font-medium tracking-[0.22em] uppercase">
      {children}
    </span>
  );
}

export default function LandingPage() {
  // Freshness counts surfaced by the live hero map, shown in the label row.
  const [legend, setLegend] = useState<Record<Bucket, number> | null>(null);

  return (
    <main className="paper-grain bg-paper font-body text-ink relative">
      <NativeEntryRedirect />
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <Contours className="text-ink/[0.06] pointer-events-none absolute inset-0 h-full w-full" />

        <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12">
            {/* Brand mascot, anchoring the hero headline. */}
            {}
            <motion.img
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              src="/icons/icon.svg"
              alt="ROSM"
              className="w-32 shrink-0 md:w-56 lg:w-72"
            />

            <div>
              <motion.h1
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.1 }}
                className="font-display max-w-5xl text-[clamp(2.2rem,7vw,5.2rem)] leading-[0.9] font-bold tracking-tight uppercase"
              >
                The DC Water
                <br />
                Fountain Map
              </motion.h1>

              <div className="mt-10 flex flex-col items-start gap-6">
                <motion.p
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.16 }}
                  className="text-ink-dim max-w-xl text-lg leading-relaxed"
                >
                  With data sourced by (and <em>for</em>) runners, this is the definitive map of
                  public fountains in DC.
                </motion.p>
                {/* Returning users: resume an in-flight run or revisit history. */}
                <HomeRunCard />
              </div>
            </div>
          </div>

          {/* Sample-route label, sitting tightly above the map plate. */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.24 }}
            className="mt-14 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 pb-2"
          >
            <Label>Sample route · Washington DC</Label>
          </motion.div>

          {/* Interactive demo of the run + edit flow, framed like a print plate. */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.28 }}
            className="border-ink/10 bg-sky relative overflow-hidden rounded-xl border"
          >
            <div className="relative isolate z-0 h-[clamp(340px,48vw,560px)] w-full">
              <DemoRunMap />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MANIFESTO SPLIT */}
      <section className="border-paper-line bg-paper-deep border-t">
        <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] font-bold tracking-tight">
              What&apos;s the deal?
            </h2>
            <p className="text-ink-dim mt-6 text-lg leading-relaxed">
              In the summer heat, I just wanted to know where I could get a sip of water on my runs.
              And so I thought I&apos;d put together a little map. But then, by stopping at the
              fountains on my map, I realized a bunch of them were out of order (some were
              missing!). So this got me to thinking about having a system for updating the
              fountains. And then it hit me: if I was already planning my runs to include passing
              one or two fountains for a drink, why not just plan a run optimized for passing the
              most fountains possible! After my first beta test of this system, I visited 23
              fountains in 7 miles, and that&apos;s when I realized even just a few runners could
              make light work of covering the whole city!
            </p>
            <p className="text-ink-dim mt-4 text-lg leading-relaxed">ROSM caters to two groups:</p>
            <ol className="text-ink-dim mt-4 list-decimal space-y-1 pl-6 text-lg leading-relaxed">
              <li>literally anyone looking for a working fountain</li>
              <li>runner (or avid walkers!) who want to verify fountains</li>
            </ol>
            <p className="text-ink-dim mt-4 text-lg leading-relaxed">
              If you&apos;re part of this second group, awesome! I&apos;ll mention there may be some
              rough edges, but if you discover something, shoot me a message{" "}
              <a
                href="mailto:james@btv.dev"
                className="text-ink decoration-sky-deep/50 hover:decoration-sky-deep font-medium underline underline-offset-4"
              >
                james@btv.dev
              </a>{" "}
              and we&apos;ll get things squared away!
            </p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — interactive demo of the run + edit flow */}
      <section className="border-paper-line border-t">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <motion.h2
            {...fadeUp}
            className="font-display text-[clamp(2rem,5.5vw,3.6rem)] leading-tight font-bold tracking-tight uppercase"
          >
            The State of the Fountains
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="text-ink-dim mt-8 max-w-2xl text-lg leading-relaxed"
          >
            Here&apos;s a live coverage map of the fountains in DC.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.18 }}
            className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 pb-2"
          >
            <Label>Live · Washington DC</Label>
            {legend && <FreshnessLegend counts={legend} />}
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.22 }}
            className="border-ink/10 bg-sky relative overflow-hidden rounded-xl border"
          >
            <div className="relative isolate z-0 h-[clamp(340px,48vw,560px)] w-full">
              <LiveFountainMap onCountsChange={setLegend} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-paper-line border-t">
        <div className="text-ink-dim mx-auto flex max-w-6xl items-center justify-center gap-4 px-5 py-8 text-sm">
          <span>
            Made with{" "}
            <HeartIcon weight="fill" className="text-sky-deep inline-block align-middle" /> by{" "}
            <a
              href="https://jamesm.it/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink decoration-sky-deep/50 hover:decoration-sky-deep font-medium underline underline-offset-4"
            >
              James Mitofsky
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
