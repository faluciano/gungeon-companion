"use client";

import { useSyncExternalStore } from "react";
import Dashboard from "./Dashboard";
import {
  GUEST_RUN_ID,
  GUEST_RUN_NAME,
  GUEST_STORAGE_KEY,
  loadGuestRun,
  type GuestRunState,
} from "@/lib/guest";

// localStorage is browser-only: the server (and hydration render) sees `null`
// and shows a placeholder, then the client snapshot mounts the dashboard with
// the saved run. The snapshot is cached by raw string so its reference stays
// stable between renders, as useSyncExternalStore requires.
let lastRaw: string | null | undefined;
let lastSnapshot: GuestRunState = { itemIds: [], quantities: {} };

function getSnapshot(): GuestRunState {
  const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastSnapshot = loadGuestRun();
  }
  return lastSnapshot;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function GuestDashboard() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (state === null) {
    return (
      <div className="grid min-h-[24rem] place-items-center text-xs uppercase tracking-[0.28em] text-ink-faint">
        Opening the Ammonomicon…
      </div>
    );
  }

  // No guest banner — guest is the default experience, and the header's
  // "Guest run · Sign in" already says how to sync. Signed-in users get the
  // "Synced" marker in the header instead.
  return (
    <>
      <Dashboard
        runId={GUEST_RUN_ID}
        runName={GUEST_RUN_NAME}
        initialItemIds={state.itemIds}
        initialQuantities={state.quantities}
        guest
      />
    </>
  );
}
