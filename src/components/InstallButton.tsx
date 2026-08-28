"use client";

import { useState, useSyncExternalStore } from "react";
import {
  canInstall,
  isIOS,
  isStandalone,
  promptInstall,
  subscribeToInstallPrompt,
} from "@/lib/pwa";

const noopSubscribe = () => () => {};

export default function InstallButton() {
  // Chromium hands us a deferred prompt...
  const installable = useSyncExternalStore(
    subscribeToInstallPrompt,
    canInstall,
    () => false,
  );
  // ...iOS Safari never does, so it gets instructions instead. Reading this
  // through a store keeps the server render (false) from mismatching.
  const iosHintAvailable = useSyncExternalStore(
    noopSubscribe,
    () => isIOS() && !isStandalone(),
    () => false,
  );
  const [hintOpen, setHintOpen] = useState(false);

  if (!installable && !iosHintAvailable) return null;

  return (
    <div className="relative">
      <button
        className="btn btn-ghost px-3 py-1.5 text-xs"
        onClick={() => {
          if (installable) {
            void promptInstall();
          } else {
            setHintOpen((open) => !open);
          }
        }}
        aria-expanded={installable ? undefined : hintOpen}
      >
        ⤓<span className="hidden sm:inline"> Install</span>
      </button>
      {!installable && hintOpen ? (
        <p className="absolute right-0 top-full z-40 mt-2 w-56 border border-line-bright bg-bg-panel p-3 text-[0.65rem] leading-relaxed text-ink-dim hard-shadow">
          Tap the Share button in Safari, then{" "}
          <span className="text-ink">Add to Home Screen</span> to install the
          Ammonomicon.
        </p>
      ) : null}
    </div>
  );
}
