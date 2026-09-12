const CACHE_VERSION = "ibadah-2026.09.12.3";

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
  const request = event.request;

  if (request.method !== "GET") return;

  // عدم اعتراض طلبات Google Sheets وApps Script الخارجية
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();

          caches
            .open(CACHE_VERSION)
            .then(cache => cache.put(request, copy));

          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(cached => cached || caches.match("./girl.html"))
        )
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const copy = response.clone();

        caches
          .open(CACHE_VERSION)
          .then(cache => cache.put(request, copy));

        return response;
      });
    })
  );
});
