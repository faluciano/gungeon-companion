"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/auth-client";
import { GUEST_COOKIE } from "@/lib/guest";

// Replaces the old auto-redirect to /run: returning visitors (guest cookie or
// session) get an explicit "continue" button on the landing page instead of
// being forwarded. Renders nothing on the server and for first-time visitors,
// so the landing page stays static and identical for crawlers.

function subscribe() {
  // The cookie can't change while the landing page is open — no-op.
  return () => {};
}

function hasGuestCookie() {
  return document.cookie.split("; ").includes(`${GUEST_COOKIE}=1`);
}

export default function ContinueRunCta() {
  const isGuest = useSyncExternalStore(subscribe, hasGuestCookie, () => false);
  const { data } = useSession();

  if (!isGuest && !data?.user) return null;

  return (
    <Link href="/run" className="btn btn-primary mt-6 inline-block px-5 py-2.5 text-sm">
      Continue your run →
    </Link>
  );
}
