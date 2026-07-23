// Service worker di Clark.
// Strategia "prima la rete": si prova sempre a scaricare la versione aggiornata,
// e si usa la copia salvata solo se non c'è connessione. In questo modo, quando
// carichi un index.html nuovo su GitHub, lo vedi subito senza restare bloccato
// su una versione vecchia in cache.

const CACHE = 'clark-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Solo richieste GET dello stesso sito: le chiamate all'AI, a Gmail e a Google
  // devono passare sempre dalla rete, senza intermediazioni.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // salva una copia aggiornata per l'uso offline
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)) // offline: usa l'ultima copia salvata
  );
});
