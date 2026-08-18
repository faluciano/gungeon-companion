"use client";

import { useSyncExternalStore } from "react";
import Dashboard from "./Dashboard";
import {
  GUEST_RUN_ID,
  GUEST_RUN_NAME,
  GUEST_STORAGE_KEY,
  loadGuestItemIds,
} from "@/lib/guest";

// localStorage is browser-only: the server (and hydration render) sees `null`
// and shows a placeholder, then the client snapshot mounts the dashboard with
// the saved run. The snapshot is cached by raw string so its reference stays
// stable between renders, as useSyncExternalStore requires.
let lastRaw: string | null | undefined;
let lastSnapshot: string[] = [];

function getSnapshot(): string[] {
  const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastSnapshot = loadGuestItemIds();
  }
  return lastSnapshot;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function GuestDashboard() {
  const itemIds = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (itemIds === null) {
    return (
      <div className="grid min-h-[24rem] place-items-center text-xs uppercase tracking-[0.28em] text-ink-faint">
        Opening the Ammonomicon…
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 border border-amber/50 bg-amber/10 px-4 py-2 text-xs text-amber">
        Guest run — saved only in this browser. Sign in with a passkey to sync
        your runs across devices.
      </div>
      <Dashboard
        runId={GUEST_RUN_ID}
        runName={GUEST_RUN_NAME}
        initialItemIds={itemIds}
        guest
      />
    </>
  );
}
