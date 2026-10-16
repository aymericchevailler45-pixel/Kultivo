'use strict';

/* ============================================================
   KULTIVO — service worker (application installable)
   ============================================================
   Stratégie « réseau d'abord » : avec internet, on charge TOUJOURS la
   dernière version du site (les modifications apparaissent tout de
   suite) et on en garde une copie. Sans internet, on utilise la copie.

   Si tu ajoutes un nouveau fichier au jeu, ajoute-le dans FILES.
   ============================================================ */

const CACHE = 'kultivo-v1';
const FILES = [
    './',
    './index.html',
    './style.css',
    './questions.js',
    './pairs.js',
    './levels.js',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon.png'
];

// Installation : on garde une première copie de tout le jeu
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
    self.skipWaiting();
});

// Activation : on supprime les anciennes copies et on prend la main tout de suite
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Chaque fichier : d'abord internet (et on met la copie à jour), sinon la copie
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(request, { cache: 'no-cache' })
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request).then(found => found || caches.match('./index.html')))
    );
});
