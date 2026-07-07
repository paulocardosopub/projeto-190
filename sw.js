const CACHE_NAME = "projeto190-runtime-v1";
const VERSION_PATH = "/version.json";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    clearOldCaches().then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_APP_CACHES") return;
  event.waitUntil(clearAllCaches());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(request, url));
});

async function networkFirst(request, url) {
  try {
    const response = await fetch(request, { cache: "reload" });
    if (shouldStoreResponse(request, url, response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

function shouldStoreResponse(request, url, response) {
  return response?.ok &&
    request.method === "GET" &&
    !url.pathname.endsWith(VERSION_PATH) &&
    (response.type === "basic" || response.type === "cors");
}

async function clearOldCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
}

async function clearAllCaches() {
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}
