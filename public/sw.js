// Service Worker Evergreen — versione minimale e sicura.
//
// Scopo: soddisfare il requisito tecnico di installabilità (Chrome/Edge/Android)
// e mettere in cache solo l'involucro statico (icone, manifest).
//
// Scelta deliberata: NON mettiamo in cache le pagine né le chiamate a Supabase.
// Mostrare disponibilità o appuntamenti vecchi dalla cache sarebbe un problema
// serio in un sistema di prenotazione, quindi tutto il resto passa dalla rete.

const CACHE_NAME = "evergreen-shell-v1";
const SHELL_ASSETS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network-first per tutto: dati sempre freschi. La cache serve solo come
// fallback per le poche risorse statiche elencate sopra.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached ?? Response.error())),
  );
});
