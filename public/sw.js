// Wedding Shred service worker.
// Strategy: network-first for HTML and JSON so deploys land immediately;
// cache-first only for /_next/static/* (Next.js content-hashes those URLs,
// so they're safe to cache forever). Bump CACHE_VERSION to force activation
// of a new SW build — old caches are dropped on activate.

const CACHE_VERSION = 'v3'
const CACHE_NAME = `wedding-shred-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  // No pre-cache — let the runtime populate as pages are visited.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('wedding-shred-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Don't intercept Supabase / API calls.
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return

  // Hashed Next.js assets — cache-first, immutable.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return response
          }),
      ),
    )
    return
  }

  // Everything else — network-first, fall back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || new Response('Offline', { status: 503 }),
        ),
      ),
  )
})
