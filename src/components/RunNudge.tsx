"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/auth-client";
import { GUEST_COOKIE } from "@/lib/guest";

// Nudge at the bottom of public item/shrine pages. Server-renders the static
// invite (what crawlers and first-time visitors see); upgrades to a
// "continue your run" button for anyone with a guest run or account session.

function subscribe() {
  // The cookie can't change while the page is open — no-op.
  return () => {};
}

function hasGuestCookie() {
  return document.cookie.split("; ").includes(`${GUEST_COOKIE}=1`);
}

export default function RunNudge({ subject }: { subject: string }) {
  const isGuest = useSyncExternalStore(subscribe, hasGuestCookie, () => false);
  const { data } = useSession();
  const hasRun = isGuest || Boolean(data?.user);

  if (hasRun) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
        <Link href="/run" className="btn btn-primary px-4 py-2 text-xs">
          Continue your run →
        </Link>
        <span>Found {subject}? Log your pickups and watch synergies light up.</span>
      </div>
    );
  }

  return (
    <p className="mt-6 text-xs text-ink-faint">
      Playing right now?{" "}
      <Link href="/" className="text-amber underline">
        Track your run
      </Link>{" "}
      and the Ammonomicon surfaces every synergy in your loadout the moment it
      becomes active.
    </p>
  );
}
