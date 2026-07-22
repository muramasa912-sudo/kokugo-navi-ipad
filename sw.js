const CACHE_PREFIX = "shogakusei-sansu-navi-ipad";
const CACHE_NAME = `${CACHE_PREFIX}-v13`;
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "images/teacher-character.png",
  "images/teacher-correct.png",
  "images/teacher-incorrect.png",
  "images/teacher-evolution/teacher_level_01.webp",
  "images/teacher-evolution/teacher_level_15.webp",
  "images/teacher-evolution/teacher_level_30.webp",
  "images/teacher-evolution/teacher_level_45.webp",
  "images/teacher-evolution/teacher_level_60.webp",
  "images/teacher-evolution/teacher_level_80.webp",
  "images/teacher-evolution/teacher_level_99.webp"
];

function normalizeLocalAssetPath(path) {
  if (!path || path.startsWith("http:") || path.startsWith("https:") || path.startsWith("data:") || path.startsWith("#")) {
    return null;
  }
  if (path.startsWith("./")) return path;
  if (path.startsWith("/")) return `.${path}`;
  return path;
}

function extractIndexAssetPaths(html) {
  const paths = [];
  const pattern = /\b(?:src|href)=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const path = normalizeLocalAssetPath(match[1]);
    if (path && (path.startsWith("./assets/") || path.startsWith("assets/"))) {
      paths.push(path);
    }
  }
  return [...new Set(paths)];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: "reload" })));
        try {
          const response = await fetch(new Request("index.html", { cache: "reload" }));
          if (!response.ok) return;
          const html = await response.clone().text();
          await cache.put("index.html", response);
          const assetPaths = extractIndexAssetPaths(html);
          await cache.addAll(assetPaths.map((url) => new Request(url, { cache: "reload" })));
        } catch {
          // Runtime caching still covers assets after a successful online load.
        }
      })
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html").then((response) => response || caches.match("./")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.destination === "document") {
          return caches.match("index.html").then((response) => response || caches.match("./"));
        }
        return Response.error();
      });
    })
  );
});
