'use strict';

/* ============================================================
   KULTIVO — service worker (application installable)
   ============================================================
   Stratégie « réseau d'abord » : avec internet, on charge TOUJOURS la
   dernière version du site (les modifications apparaissent tout de
   suite) et on en garde une copie. Sans internet, on utilise la copie.

   Si tu ajoutes un nouveau fichier au jeu, ajoute-le dans FILES.
   ============================================================ */

const CACHE = 'kultivo-v3';
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
    // emojis des rébus (Twemoji)
    './emoji/1f198.svg',
    './emoji/1f30a.svg',
    './emoji/1f327.svg',
    './emoji/1f333.svg',
    './emoji/1f34a.svg',
    './emoji/1f34e.svg',
    './emoji/1f36b.svg',
    './emoji/1f372.svg',
    './emoji/1f37d.svg',
    './emoji/1f381.svg',
    './emoji/1f388.svg',
    './emoji/1f3de.svg',
    './emoji/1f3e0.svg',
    './emoji/1f3ed.svg',
    './emoji/1f400.svg',
    './emoji/1f407.svg',
    './emoji/1f412.svg',
    './emoji/1f414.svg',
    './emoji/1f41f.svg',
    './emoji/1f422.svg',
    './emoji/1f426.svg',
    './emoji/1f42c.svg',
    './emoji/1f431.svg',
    './emoji/1f43a.svg',
    './emoji/1f43c.svg',
    './emoji/1f445.svg',
    './emoji/1f451.svg',
    './emoji/1f468.svg',
    './emoji/1f474.svg',
    './emoji/1f478.svg',
    './emoji/1f479.svg',
    './emoji/1f47b.svg',
    './emoji/1f48d.svg',
    './emoji/1f494.svg',
    './emoji/1f49b.svg',
    './emoji/1f4a7.svg',
    './emoji/1f4d6.svg',
    './emoji/1f519.svg',
    './emoji/1f52e.svg',
    './emoji/1f534.svg',
    './emoji/1f54a.svg',
    './emoji/1f577.svg',
    './emoji/1f602.svg',
    './emoji/1f622.svg',
    './emoji/1f634.svg',
    './emoji/1f6a2.svg',
    './emoji/1f90f.svg',
    './emoji/1f910.svg',
    './emoji/1f934.svg',
    './emoji/1f93a.svg',
    './emoji/1f94b.svg',
    './emoji/1f977.svg',
    './emoji/1f981.svg',
    './emoji/1f987.svg',
    './emoji/1f98a.svg',
    './emoji/1f98d.svg',
    './emoji/1f996.svg',
    './emoji/1f9b6.svg',
    './emoji/1f9b7.svg',
    './emoji/1f9c0.svg',
    './emoji/1f9ca.svg',
    './emoji/1f9d1.svg',
    './emoji/1f9f8.svg',
    './emoji/1fa90.svg',
    './emoji/1faa2.svg',
    './emoji/1fab0.svg',
    './emoji/1fab3.svg',
    './emoji/2601.svg',
    './emoji/2694.svg',
    './emoji/2699.svg',
    './emoji/26ab.svg',
    './emoji/270a.svg',
    './emoji/2744.svg',
    './emoji/27a1.svg',
    './emoji/2b07.svg',
    './emoji/2b50.svg',
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
