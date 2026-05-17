const CACHE_NAME = "coursera-offline-shell-v1";
const COURSE_ROUTES = [
  "/",
  "/profile",
  "/certificate",
  "/course/microsoft-front-end",
  "/course/microsoft-backend",
  "/course/microsoft-fullstack",
  "/course/microsoft-project-management",
];

const isSameOriginAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/favicon.ico");

const normalizeAssetUrl = (assetUrl) => {
  if (!assetUrl) {
    return "";
  }

  if (assetUrl.startsWith("http")) {
    return assetUrl;
  }

  return new URL(assetUrl, self.location.origin).toString();
};

const extractStaticAssets = (html) => {
  const assetMatches = html.matchAll(
    /(?:src|href)="([^"]*\/_next\/static\/[^"]+\.(?:js|css))"/g
  );

  return [...assetMatches].map((match) => normalizeAssetUrl(match[1]));
};

const cacheRouteWithAssets = async (cache, route) => {
  const response = await fetch(route, { cache: "reload" });

  if (!response.ok) {
    return;
  }

  await cache.put(route, response.clone());

  const html = await response.text();
  const assets = extractStaticAssets(html);

  await Promise.allSettled(
    assets.map(async (asset) => {
      const assetResponse = await fetch(asset, { cache: "reload" });

      if (assetResponse.ok) {
        await cache.put(asset, assetResponse);
      }
    })
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          COURSE_ROUTES.map((route) => cacheRouteWithAssets(cache, route))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (isSameOriginAsset(requestUrl)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(async () => {
          const cachedRoute = await caches.match(request);

          if (cachedRoute) {
            return cachedRoute;
          }

          return (
            (await caches.match("/")) ||
            new Response("Offline content is unavailable.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationUrl = event.notification.data?.url || "/";
  const targetUrl = new URL(notificationUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clientList) => {
        const existingClient = clientList.find((client) => {
          const clientUrl = new URL(client.url);

          return clientUrl.origin === self.location.origin;
        });

        if (existingClient) {
          existingClient.navigate(targetUrl);
          return existingClient.focus();
        }

        return clients.openWindow(targetUrl);
      })
  );
});
