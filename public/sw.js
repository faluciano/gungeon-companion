// Ammonomicon service worker.
//
// Deliberately conservative: it exists so the app is installable and survives a
// dropped connection mid-run. It never caches HTML documents or API responses,
// so a signed-in run is always read from the network.
//
// Bump CACHE when the precache list, the offline page, or the strategy changes
// — otherwise installed clients keep serving the old precached copies.
const CACHE = "ammonomicon-v2";

const PRECACHE = [
  "/offline",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // A single failed entry must not fail the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: always the network, with the offline page as the last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/offline");
        return (
          cached ??
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Only content-hashed build output is safe to serve cache-first. The dev
  // server's /_next/static/chunks/ URLs are path-based and mutable — caching
  // them once poisoned every later dev session with stale code (v1 did this).
  const cacheable =
    url.pathname.startsWith("/_next/static/immutable/") ||
    url.pathname.startsWith("/_next/static/media/") ||
    PRECACHE.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
