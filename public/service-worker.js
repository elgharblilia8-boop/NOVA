// Augmenter VERSION à chaque mise en ligne pour forcer la mise à jour du cache.
const VERSION = "nova-v2";
const SHELL = ["./", "index.html", "style.css", "actions.js", "script.js", "manifest.json",
  "assets/favicon.svg", "assets/icon-192.png", "assets/icon-512.png",
  "assets/icon-maskable-512.png", "assets/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.pathname === "/chat" || u.pathname.startsWith("/.netlify/")) return; // jamais en cache
  if (r.mode === "navigate") { // page : réseau d’abord, cache si hors ligne
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(VERSION).then(h => h.put("index.html", c)); return x; })
      .catch(() => caches.match("index.html")));
    return;
  }
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.host)) { // fichiers : cache puis mise à jour en arrière-plan
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(x => { if (x.ok || x.type === "opaque") { const c = x.clone(); caches.open(VERSION).then(h => h.put(r, c)); } return x; }).catch(() => hit);
      return hit || net;
    }));
  }
});
