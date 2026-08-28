"use client";

import { useEffect } from "react";
import { trackStandaloneLaunch } from "@/lib/pwa";

/**
 * Registers the service worker and records installed-app launches.
 * Renders nothing.
 */
export default function PwaSetup() {
  useEffect(() => {
    trackStandaloneLaunch();

    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // An unregistered worker only costs offline support; nothing to recover from.
    });
  }, []);

  return null;
}
