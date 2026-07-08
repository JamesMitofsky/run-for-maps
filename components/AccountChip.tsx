"use client";

import Link from "next/link";
import { SignInIcon, LinkIcon } from "@phosphor-icons/react";
import OsmSignInLink from "@/components/OsmSignInLink";
import { useOsmStatus } from "@/components/OsmStatus";
import { useOsmUser } from "@/hooks/useOsmUser";
import { useOutbox, outboxCounts } from "@/store/outbox";

// Shared style for a full-width drawer menu row: icon + label, bottom divider.
// Exported so nav links and the account row render identically.
export const MENU_ROW_CLASS =
  "border-paper-line text-ink hover:text-ink-dim flex items-center gap-3 border-b py-4 text-base font-semibold transition";

// The user's presence in any header: signed out → a sign-in affordance; signed
// in → a "Your Connection" link, with a dot when edits are still waiting to reach OSM.
// Renders nothing while the auth status resolves.
//   variant="chip" (default) → compact header chip.
//   variant="row"            → full-width drawer menu row matching nav links.
//   showSignIn=false         → keep "Your Connection" even when signed out (the
//                              /connected page is ungated), so nav shows a stable
//                              item instead of swapping in a sign-in affordance.
export default function AccountChip({
  variant = "chip",
  onNavigate,
  showSignIn = true,
}: {
  variant?: "chip" | "row";
  onNavigate?: () => void;
  showSignIn?: boolean;
}) {
  const { status } = useOsmStatus();
  const user = useOsmUser();
  const outboxItems = useOutbox((s) => s.items);
  const unsent = outboxCounts(outboxItems).unsent;

  if (!status) return null;

  const row = variant === "row";

  if (!status.loggedIn && showSignIn) {
    return (
      <OsmSignInLink
        onClick={onNavigate}
        className={
          row
            ? MENU_ROW_CLASS
            : "border-paper-line bg-paper/90 text-ink-dim hover:text-ink flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition"
        }
      >
        {row && <SignInIcon size={20} weight="bold" className="text-ink-dim shrink-0" />}
        Sign in
      </OsmSignInLink>
    );
  }

  return (
    <Link
      href="/connected"
      onClick={onNavigate}
      title={user?.username ?? "Connected to OSM"}
      className={
        row
          ? MENU_ROW_CLASS
          : "text-ink-dim hover:text-ink relative inline-flex items-center text-sm font-semibold transition"
      }
    >
      {row && <LinkIcon size={20} weight="bold" className="text-ink-dim shrink-0" />}
      Your Connection
      {unsent > 0 && (
        <span
          title={`${unsent} edit${unsent === 1 ? "" : "s"} waiting to sync`}
          className={
            row
              ? "ml-1 h-2 w-2 rounded-full bg-amber-500"
              : "ring-paper absolute -top-0.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2"
          }
        />
      )}
    </Link>
  );
}
