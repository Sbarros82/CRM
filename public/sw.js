/* Install-only SW — do NOT intercept fetch.
   A fetch handler here broke Next.js RSC navigations after login
   on Android installed PWAs ("This page couldn't load"). */
const SW_VERSION = "snap-pwa-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
      // Tell open tabs the broken v2 fetch handler is gone.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED", version: SW_VERSION });
      }
    })(),
  );
});
