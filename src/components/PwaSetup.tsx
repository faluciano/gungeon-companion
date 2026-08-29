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

    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // A worker left behind by a local production run (`next start`) serves
      // stale cached chunks cache-first, which breaks hydration against the
      // dev server's fresh HTML. Tear it down instead of just not registering.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // An unregistered worker only costs offline support; nothing to recover from.
    });
  }, []);

  return null;
}
