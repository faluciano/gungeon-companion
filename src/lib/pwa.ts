"use client";

import { track } from "@vercel/analytics";

// Chromium-only event; not in lib.dom yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Listener = () => void;

/** Where an install was started from, so the funnel can compare entry points. */
export type InstallSource = "header" | "banner";

type AnalyticsWindow = Window & {
  va?: (...params: unknown[]) => void;
  vaq?: unknown[][];
};

/**
 * `track()` is a silent no-op until `<Analytics />` has created `window.va`,
 * which happens in an effect inside a Suspense boundary — after PwaSetup's
 * effect and possibly after `beforeinstallprompt`. Creating the same queue
 * stub Vercel's script snippet uses buffers the event until the script loads.
 */
function trackEvent(...args: Parameters<typeof track>) {
  const w = window as AnalyticsWindow;
  w.va ??= (...params) => {
    (w.vaq ??= []).push(params);
  };
  track(...args);
}

/** Runs `fn` once per tab session; storage failures just mean it may repeat. */
function oncePerSession(key: string, fn: () => void) {
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or storage disabled — repeating the event is harmless.
  }
  fn();
}

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
 * Safari is the only engine with no install API — it installs through a menu
 * item instead, which differs between iPhone and Mac. Every Chromium browser
 * (on any OS) gives us `beforeinstallprompt`, so it never needs a hint.
 *
 * Returns the platform whose instructions to show, or null when the browser
 * either offers a real prompt or cannot install at all.
 */
export function manualInstallPlatform(): "ios" | "macos" | null {
  if (typeof navigator === "undefined") return null;
  if (isStandalone()) return null;

  const isSafari =
    navigator.vendor === "Apple Computer, Inc." &&
    // Chrome/Firefox/Edge on iOS are WebKit wrappers sharing Apple's vendor
    // string, and none of them can install to the home screen.
    !/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Edg\//.test(navigator.userAgent);
  if (!isSafari) return null;

  return isIOS() ? "ios" : "macos";
}

/**
 * Opens the browser's install dialog and reports the user's choice.
 * Resolves to the outcome, or null when no prompt was available.
 */
export async function promptInstall(source: InstallSource) {
  const event = deferredPrompt;
  if (!event) return null;

  // A deferred prompt can only be used once.
  deferredPrompt = null;
  emit();

  await event.prompt();
  const { outcome } = await event.userChoice;
  trackEvent("pwa_install_prompt", { outcome, source });
  return outcome;
}

/**
 * Safari has no prompt, so opening the manual instructions is the closest
 * thing to an install attempt we can measure there.
 */
export function trackInstallHint(platform: "ios" | "macos", source: InstallSource) {
  trackEvent("pwa_install_hint", { platform, source });
}

/**
 * Records the one install signal iOS gives us: the app being launched from the
 * home screen. Fires at most once per tab so repeat navigations don't inflate it.
 */
export function trackStandaloneLaunch() {
  if (!isStandalone()) return;
  oncePerSession("pwa-launch-tracked", () =>
    trackEvent("pwa_launch", { platform: isIOS() ? "ios" : "other" }),
  );
}

if (typeof window !== "undefined") {
  // Registered at module scope: `beforeinstallprompt` can fire before React
  // mounts, and the event is only useful if we capture it.
  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress the mini-infobar so the in-app install button drives the flow.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
    // Chromium refires this on every full page load; count sessions, not loads.
    oncePerSession("pwa-install-available-tracked", () =>
      trackEvent("pwa_install_available"),
    );
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
    trackEvent("pwa_installed", { platform: isIOS() ? "ios" : "other" });
  });
}
