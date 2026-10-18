// Offline support. The page itself is network-first (so updates appear straight away and the
// cache is only a fallback); hashed assets and textures are cache-first.
const CACHE = "fantasy-chess-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document" || /\.(webmanifest|json)$/.test(new URL(req.url).pathname);
  e.respondWith(caches.open(CACHE).then(async cache => {
    if (isPage) {
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch { return (await cache.match(req)) ?? Response.error(); }
    }
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  }));
});
