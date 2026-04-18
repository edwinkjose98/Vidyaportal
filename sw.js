const CACHE_NAME = 'kvp-cache-v4-prod';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './kerala-logo.png',
  './logo.jpg',
  './workflow.png',
  './nursing_college_category_1774427669008.png',
  './management_college_category_1774427684353.png',
  './engineering_college_category_1774427701464.png',
  './paramedical_college_category_1774427719498.png',
  './diploma_college_category.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
