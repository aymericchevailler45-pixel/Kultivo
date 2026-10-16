'use strict';

/* ============================================================
   KULTIVO — service worker (application installable)
   ============================================================
   Stratégie « réseau d'abord » : avec internet, on charge TOUJOURS la
   dernière version du site (les modifications apparaissent tout de
   suite) et on en garde une copie. Sans internet, on utilise la copie.

   Si tu ajoutes un nouveau fichier au jeu, ajoute-le dans FILES.
   ============================================================ */

const CACHE = 'kultivo-v2';
const FILES = [
    './',
    './index.html',
    './style.css',
    './questions.js',
    './pairs.js',
    './order.js',
    './levels.js',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon.png',
    // drapeaux (questions et paires « Drapeaux »)
    './flags/ar.svg',
    './flags/au.svg',
    './flags/be.svg',
    './flags/bn.svg',
    './flags/br.svg',
    './flags/bt.svg',
    './flags/ca.svg',
    './flags/ch.svg',
    './flags/ci.svg',
    './flags/cl.svg',
    './flags/cn.svg',
    './flags/co.svg',
    './flags/de.svg',
    './flags/dz.svg',
    './flags/es.svg',
    './flags/fr.svg',
    './flags/gb.svg',
    './flags/gr.svg',
    './flags/ie.svg',
    './flags/il.svg',
    './flags/in.svg',
    './flags/is.svg',
    './flags/it.svg',
    './flags/jm.svg',
    './flags/jp.svg',
    './flags/ke.svg',
    './flags/kg.svg',
    './flags/kr.svg',
    './flags/kz.svg',
    './flags/lb.svg',
    './flags/lk.svg',
    './flags/ma.svg',
    './flags/mx.svg',
    './flags/mz.svg',
    './flags/nl.svg',
    './flags/no.svg',
    './flags/np.svg',
    './flags/nz.svg',
    './flags/pl.svg',
    './flags/pt.svg',
    './flags/ro.svg',
    './flags/ru.svg',
    './flags/se.svg',
    './flags/sn.svg',
    './flags/tn.svg',
    './flags/tr.svg',
    './flags/ua.svg',
    './flags/us.svg',
    './flags/vn.svg',
    './flags/za.svg'
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
