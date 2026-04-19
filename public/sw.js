// Service Worker — SST Manager (PWA básico)
// Estratégia: network-first para navegação, cache-first para assets estáticos.
// Evita cachear rotas API (/api/*) e auth (/login).

const CACHE_NAME = "sst-manager-v1"
const STATIC_ASSETS = ["/", "/manifest.json", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Nunca cacheia APIs ou auth
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/login") || url.pathname.startsWith("/auth")) {
    return
  }

  // Só GET
  if (event.request.method !== "GET") return

  // Network-first para navegação (HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy))
          return resp
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/")))
    )
    return
  }

  // Cache-first para assets estáticos de /_next/static
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy))
          return resp
        })
      })
    )
  }
})
