/* Guarda la app en el celular para que abra sin internet. Cambia VERSION en cada publicación. */
const VERSION = 'fh-v1';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'icono-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   /* La API de Google no se toca */
  /* Primero intenta internet (3 s) para tener la última versión; si no hay, usa la copia guardada */
  e.respondWith(new Promise(resolve => {
    let listo = false;
    const deCache = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'));
    const t = setTimeout(() => { if (!listo) { listo = true; resolve(deCache()); } }, 3000);
    fetch(e.request).then(r => {
      if (r && r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
      if (!listo) { listo = true; clearTimeout(t); resolve(r); }
    }).catch(() => { if (!listo) { listo = true; clearTimeout(t); resolve(deCache()); } });
  }));
});
