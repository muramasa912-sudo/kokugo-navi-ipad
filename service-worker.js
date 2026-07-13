const CACHE_NAME = "kokugo-navi-ipad-v16";

const CACHE_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./src/main.js",
  "./src/app.js",
  "./src/lessonLoader.js",
  "./src/quizEngine.js",
  "./src/testMode.js",
  "./src/reportCard.js",
  "./src/speech.js",
  "./src/styles.css",
  "./assets/lessons/kokugo_sample_lessons.json",
  "./assets/lessons/kokugo_lower_grade_expansion_lessons.json",
  "./assets/lessons/kokugo_middle_grade_expansion_lessons.json",
  "./assets/lessons/aozora_middle_grade_lessons.json",
  "./assets/lessons/aozora_upper_grade_lessons.json",
  "./assets/lessons/thinking_challenge_lessons.json",
  "./assets/images/kokugo_teacher.png",
  "./assets/images/kokugo_teacher_encourage.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/favicon-16.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(CACHE_FILES.map((file) => cache.add(file).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match("./index.html");
        });
    })
  );
});
