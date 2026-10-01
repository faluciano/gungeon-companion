"use client";

import { useState, useSyncExternalStore } from "react";
import {
  canInstall,
  manualInstallPlatform,
  promptInstall,
  subscribeToInstallPrompt,
  trackInstallHint,
  type InstallSource,
} from "@/lib/pwa";

const noopSubscribe = () => () => {};

/**
 * Which install path this browser offers: a deferred Chromium prompt, Safari
 * instructions, or nothing. Shared by the header button and the run banner.
 */
export function useInstallState() {
  // Chromium hands us a deferred prompt — desktop included, so this is the
  // path most Mac and Windows users take.
  const installable = useSyncExternalStore(
    subscribeToInstallPrompt,
    canInstall,
    () => false,
  );
  // Safari has no prompt to defer, so it gets instructions instead. Reading
  // this through a store keeps the server render (null) from mismatching.
  const manualPlatform = useSyncExternalStore(
    noopSubscribe,
    manualInstallPlatform,
    () => null,
  );
  const [hintOpen, setHintOpen] = useState(false);

  function startInstall(source: InstallSource) {
    if (installable) {
      void promptInstall(source);
    } else if (manualPlatform) {
      if (!hintOpen) trackInstallHint(manualPlatform, source);
      setHintOpen(!hintOpen);
    }
  }

  return { installable, manualPlatform, hintOpen, startInstall };
}

export function InstallHint({ platform }: { platform: "ios" | "macos" }) {
  return platform === "ios" ? (
    <>
      Tap the Share button in Safari, then{" "}
      <span className="text-ink">Add to Home Screen</span> to install the
      Ammonomicon.
    </>
  ) : (
    <>
      In Safari, choose <span className="text-ink">File → Add to Dock</span> to
      install the Ammonomicon. Requires macOS Sonoma or later.
    </>
  );
}

export default function InstallButton() {
  const { installable, manualPlatform, hintOpen, startInstall } = useInstallState();

  if (!installable && !manualPlatform) return null;

  return (
    <div className="relative">
      <button
        className="btn btn-ghost px-3 py-1.5 text-xs"
        onClick={() => startInstall("header")}
        aria-expanded={installable ? undefined : hintOpen}
      >
        ⤓<span className="hidden sm:inline"> Install</span>
      </button>
      {!installable && hintOpen && manualPlatform ? (
        <p className="absolute right-0 top-full z-40 mt-2 w-56 border border-line-bright bg-bg-panel p-3 text-[0.65rem] leading-relaxed text-ink-dim hard-shadow">
          <InstallHint platform={manualPlatform} />
        </p>
      ) : null}
    </div>
  );
}
