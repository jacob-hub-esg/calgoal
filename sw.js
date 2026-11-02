// Rung by Rung offline support.
// Change VERSION whenever you upload new app files, so phones pick up the update.
const VERSION = "v1";
const CACHE = "rung-by-rung-" + VERSION;
const FILES = [
  "./", "./index.html", "./styles.css", "./data.js", "./app.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png",
  "./fonts/big-shoulders-display-latin-700-normal.woff2", "./fonts/big-shoulders-display-latin-800-normal.woff2",
  "./fonts/figtree-latin-400-normal.woff2", "./fonts/figtree-latin-500-normal.woff2",
  "./fonts/figtree-latin-600-normal.woff2", "./fonts/figtree-latin-700-normal.woff2",
  "./fonts/ibm-plex-mono-latin-500-normal.woff2"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("rung-by-rung-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from the phone first so the app opens instantly and offline; refresh the copy in the background.
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const fromNetwork = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
    return res;
  }).catch(() => null);
  event.waitUntil(fromNetwork);
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fromNetwork;
    if (res) return res;
    if (req.mode === "navigate") return caches.match("./index.html");
    return new Response("", { status: 504 });
  })());
});
