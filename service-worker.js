const CACHE_VERSION = "ibadah-2026.09.12.1";

const APP_SHELL = [
  "./",
  "./girl.html",
  "./manager.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.map(key =>
            key !== CACHE_VERSION ? caches.delete(key) : null
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => {
          const copy = res.clone();

          caches
            .open(CACHE_VERSION)
            .then(cache => cache.put(req, copy));

          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then(cached => cached || caches.match("./girl.html"))
        )
    );

    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (!res || res.status !== 200) return res;

        const copy = res.clone();

        caches
          .open(CACHE_VERSION)
          .then(cache => cache.put(req, copy));

        return res;
      });
    })
  );
});
