"use client";

import { track } from "@vercel/analytics";

// Chromium-only event; not in lib.dom yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToInstallPrompt(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function canInstall() {
  return deferredPrompt !== null;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Opens the browser's install dialog and reports the user's choice.
 * Resolves to the outcome, or null when no prompt was available.
 */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return null;

  // A deferred prompt can only be used once.
  deferredPrompt = null;
  emit();

  await event.prompt();
  const { outcome } = await event.userChoice;
  track("pwa_install_prompt", { outcome });
  return outcome;
}

/**
 * Records the one install signal iOS gives us: the app being launched from the
 * home screen. Fires at most once per tab so repeat navigations don't inflate it.
 */
export function trackStandaloneLaunch() {
  if (!isStandalone()) return;
  try {
    if (sessionStorage.getItem("pwa-launch-tracked")) return;
    sessionStorage.setItem("pwa-launch-tracked", "1");
  } catch {
    // Private mode or storage disabled — tracking the launch again is harmless.
  }
  track("pwa_launch", { platform: isIOS() ? "ios" : "other" });
}

if (typeof window !== "undefined") {
  // Registered at module scope: `beforeinstallprompt` can fire before React
  // mounts, and the event is only useful if we capture it.
  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress the mini-infobar so the in-app install button drives the flow.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
    track("pwa_install_available");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
    track("pwa_installed", { platform: isIOS() ? "ios" : "other" });
  });
}
