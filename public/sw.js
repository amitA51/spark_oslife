// Placeholder service worker entry file required by VitePWA/Workbox injectManifest.
// The actual logic is in sw-custom.js and will be injected into this file at build time.
// Do NOT add application logic here; put it in sw-custom.js instead.

/* eslint-disable no-undef */

self.addEventListener('install', () => {
  // This file exists only as an injectManifest entry point.
  // Workbox will replace its content during the build.
  // Keeping a minimal listener avoids some browsers treating it as a no-op SW.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});