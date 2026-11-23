// atlas Karten offline: erst das Netz, damit eine neue Fassung sofort gilt;
// ohne Netz, was zuletzt kam. Nur die eigene Seite — GitHub nie.
const CACHE = 'atlas-karten-1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const anfrage = e.request
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      try {
        // Die Seite selbst nie aus dem Speicher des Browsers: GitHub Pages erlaubt ihn
        // 10 Minuten, so galt eine neue Fassung erst danach (2026-11-21). Eine Navigation
        // lässt sich nur über ihre Adresse mit anderen Optionen holen.
        const antwort = await (anfrage.mode === 'navigate' ? fetch(anfrage.url, { cache: 'no-cache' }) : fetch(anfrage))
        if (antwort.ok) await cache.put(anfrage, antwort.clone())
        return antwort
      } catch {
        const alt = await cache.match(anfrage, { ignoreSearch: true })
        if (alt !== undefined) return alt
        if (anfrage.mode === 'navigate') {
          const start = (await cache.match('./index.html')) ?? (await cache.match('./'))
          if (start !== undefined) return start
        }
        return Response.error()
      }
    })(),
  )
})
