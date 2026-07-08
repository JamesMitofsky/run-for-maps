"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ContributePage() {
  return (
    <main className="paper-grain bg-paper font-body text-ink relative">
      <SiteNav />

      <section className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <motion.h1
          {...fadeUp}
          className="font-display text-[clamp(2rem,6vw,3.4rem)] leading-[0.95] font-bold tracking-tight"
        >
          How Auth Works
        </motion.h1>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.12 }}
          className="text-ink-dim mt-8 flex flex-col gap-5 text-lg leading-relaxed"
        >
          <p>
            The authentication approach taken by ROSM is different from most apps. You can think of
            ROSM as a wrapper around the OpenStreetMap (OSM) platform. For example, if you were to
            mark a fountain as <em>out of order</em>, ROSM formats that information and immediately
            submits it to OSM. In this way, ROSM retains no information about the people who use
            it—your authentication is completely local to your device, and it creates a portal for
            you to interact with OSM.
          </p>
          <p>
            If you wanted to see the complete history of updates you submitted to OSM, you would
            want to look at{" "}
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-deep underline"
            >
              your OSM account
            </a>
            .
          </p>
          <p>
            All this is to say: you need to create an account through OSM instead of ROSM because
            OSM is the place your information really lives. The only thing ROSM does is facilitate a
            very specific type of data manipulation. Because the UI for OSM is meant to support
            updating information about buildings and roads and businesses and countries, it needs to
            take a pretty general approach to the design. ROSM simplifies the many clicks it would
            take to update a fountain into just a few, and then it ships that information off to OSM
            to be safely recorded for public use.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.18 }}
          className="mt-10"
        >
          <Link
            href="/login?returnTo=/plan"
            className="bg-ink text-paper hover:bg-ink-soft inline-flex items-center rounded-sm px-7 py-3.5 font-bold transition"
          >
            Connect with OSM to begin
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
