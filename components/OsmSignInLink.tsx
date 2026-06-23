"use client";

import type { ReactNode } from "react";
import { isNative } from "@/lib/api";
import { signInOsm } from "@/lib/osmAuth";

// Shared "Sign in to OSM" affordance.
//   web    → a link to the cookie-based OAuth route (/api/osm/auth).
//   native → a button that opens the OAuth flow in an in-app browser; the token
//            returns via the rosm:// deep link (see lib/osmAuth).
// Caller controls className/children so it matches each context; optional onClick
// runs after sign-in is kicked off (e.g. schedule a status refresh).
export default function OsmSignInLink({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (isNative()) {
    return (
      <button
        type="button"
        onClick={() => {
          signInOsm();
          onClick?.();
        }}
        className={className}
      >
        {children}
      </button>
    );
  }
  return (
    <a href="/api/osm/auth" className={className} onClick={onClick}>
      {children}
    </a>
  );
}
