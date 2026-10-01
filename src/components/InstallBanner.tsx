"use client";

import { useSyncExternalStore } from "react";
import { InstallHint, useInstallState } from "@/components/InstallButton";

const DISMISSED_KEY = "install-banner-dismissed";
const dismissListeners = new Set<() => void>();

function subscribeDismissed(listener: () => void) {
  dismissListeners.add(listener);
  return () => {
    dismissListeners.delete(listener);
  };
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage disabled — the banner just comes back next visit.
  }
  for (const listener of dismissListeners) listener();
}

/**
 * Run trackers are the visitors who benefit most from an installed app, but
 * the header's icon-only button is easy to miss on phones. This offers the
 * same install path once, above the tracker, until it's dismissed.
 */
export default function InstallBanner() {
  const { installable, manualPlatform, hintOpen, startInstall } = useInstallState();
  // Server and hydration render treat it as dismissed so nothing flashes in.
  const dismissed = useSyncExternalStore(subscribeDismissed, isDismissed, () => true);

  if (dismissed || (!installable && !manualPlatform)) return null;

  return (
    <div className="panel mb-4 flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-ink-dim">
      <p className="min-w-0 flex-1">
        {!installable && hintOpen && manualPlatform ? (
          <InstallHint platform={manualPlatform} />
        ) : (
          <>
            <span className="text-ink">Install the Ammonomicon</span> to open your
            run tracker straight from your home screen.
          </>
        )}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          className="btn btn-primary px-3 py-1.5 text-xs"
          onClick={() => startInstall("banner")}
          aria-expanded={installable ? undefined : hintOpen}
        >
          ⤓ Install
        </button>
        <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
