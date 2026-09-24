/* Minimal service worker — satisfies installability; network-first for pages. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through; no offline shell required for v1 companion app.
});
