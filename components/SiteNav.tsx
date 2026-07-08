"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CompassIcon, DropIcon, ListIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react";
import AccountChip, { MENU_ROW_CLASS } from "@/components/AccountChip";
import { useOsmStatus } from "@/components/OsmStatus";

// Hydration-safe client detection: returns false during SSR / first paint,
// true once mounted on the client — without setState-in-effect.
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// The site pages, in nav order. `cta` renders as the filled primary action.
const NAV_LINKS = [
  { href: "/fountains", label: "Fountains near you", icon: DropIcon },
  { href: "/auth-explained", label: "Authentication Explained", icon: LockKeyIcon },
] as const;

// Top-of-page navigation, mobile-first: a hamburger opens an off-canvas drawer
// that slides in from the right over a dimmed backdrop. From md up the links sit
// inline and the drawer machinery disappears.
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  // Drives the primary CTA: not connected → "Begin Mapping" → /login; connected
  // → the account chip. Null while the status is still resolving (render nothing).
  const { status } = useOsmStatus();
  // Portal target only exists client-side; gate rendering until mounted.
  const mounted = useMounted();

  // Lock body scroll and wire Esc-to-close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="border-paper-line bg-paper/85 sticky top-0 z-[110] border-b pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <nav className="mx-auto max-w-6xl px-5">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-5" onClick={() => setOpen(false)}>
              <span className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon.svg" alt="" className="h-7 w-7" />
                <span className="font-display text-lg font-bold tracking-tight">ROSM</span>
              </span>
              <span className="text-ink-dim hidden font-mono text-[0.65rem] tracking-[0.22em] uppercase lg:inline">
                Running for Open-Sourced Maps
              </span>
            </Link>

            {/* Mobile: one button toggles the drawer, morphing between the
                hamburger (closed) and an X (open). It sits above the drawer
                overlay via the header's z-index, so it stays the close affordance. */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-nav-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              className="border-ink text-ink hover:bg-ink hover:text-paper rounded-sm border p-2 transition md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="block"
                >
                  {open ? <XIcon size={20} weight="bold" /> : <ListIcon size={20} weight="bold" />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Desktop: inline links. */}
            <div className="hidden shrink-0 items-center gap-3 md:flex">
              {NAV_LINKS.map(({ href, label, ...l }) => (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center text-sm font-semibold whitespace-nowrap transition ${
                    "cta" in l && l.cta
                      ? "border-ink bg-ink text-paper hover:bg-ink-soft rounded-sm border px-5 py-2 font-bold"
                      : "text-ink-dim hover:text-ink px-1 py-2"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {status?.loggedIn ? (
                <AccountChip />
              ) : status ? (
                <Link
                  href="/login"
                  className="border-ink bg-ink text-paper hover:bg-ink-soft inline-flex items-center rounded-sm border px-5 py-2 text-sm font-bold whitespace-nowrap transition"
                >
                  Begin Mapping
                </Link>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile off-canvas drawer, portaled to <body> so it escapes the sticky
          header's stacking context and reliably covers the page. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[100] md:hidden">
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
                />
                <motion.div
                  id="site-nav-drawer"
                  role="dialog"
                  aria-modal="true"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
                  className="bg-paper border-paper-line absolute top-0 right-0 flex h-full w-4/5 max-w-xs flex-col border-l px-5 pt-[calc(env(safe-area-inset-top)+5rem)] shadow-xl"
                >
                  <div className="flex flex-col">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={MENU_ROW_CLASS}
                      >
                        <Icon size={20} weight="bold" className="text-ink-dim shrink-0" />
                        {label}
                      </Link>
                    ))}
                    {status?.loggedIn ? (
                      <AccountChip variant="row" onNavigate={() => setOpen(false)} />
                    ) : status ? (
                      <Link href="/login" onClick={() => setOpen(false)} className={MENU_ROW_CLASS}>
                        <CompassIcon size={20} weight="bold" className="text-ink-dim shrink-0" />
                        Begin Mapping
                      </Link>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
