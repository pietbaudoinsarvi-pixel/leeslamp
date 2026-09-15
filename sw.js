importScripts('./version.js');
const VERSION = 'leeslamp-' + self.LEESLAMP_VERSION;
const VENDOR = [
    'view.js', 'epub.js', 'mobi.js', 'fb2.js', 'comic-book.js', 'fixed-layout.js',
    'paginator.js', 'progress.js', 'epubcfi.js', 'overlayer.js', 'search.js',
    'text-walker.js', 'footnotes.js', 'ui/tree.js', 'vendor/zip.js', 'vendor/fflate.js',
];
const SHELL = ['./', './index.html', './app.js', './autocat.js', './sw.js', './version.js', './manifest.json', './icon.svg',
    './config.js', './sync.js', './vendor/supabase.js',
    ...VENDOR.map(file => `./vendor/foliate-js/${file}`)];
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(VERSION);
        await cache.addAll(SHELL);
    })());
});
self.addEventListener('message', e => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return;
    if (!['http:', 'https:'].includes(url.protocol)) return;
    const sameOrigin = url.origin === self.location.origin;
    const allowed = sameOrigin || ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
    if (!allowed) return;
    const root = new URL('./', self.location.href).pathname;
    const appNavigation = sameOrigin && request.mode === 'navigate' && [root, root + 'en', root + 'index.html'].includes(url.pathname);
    const networkFirst = appNavigation || sameOrigin && ['', 'index.html', 'app.js', 'autocat.js', 'config.js', 'sync.js', 'sw.js'].some(path => url.pathname === root + path);
    event.respondWith((async () => {
        const cache = await caches.open(VERSION);
        const cached = () => appNavigation ? cache.match('./index.html') : cache.match(request, { ignoreSearch: networkFirst });
        const network = async () => {
            const response = await fetch(request);
            if (response.ok || response.type === 'opaque') {
                // Complete cache writes within the fetch event lifetime.
                try { await cache.put(appNavigation ? './index.html' : request, response.clone()); } catch { /* Quota must not break reading. */ }
            }
            return response;
        };
        if (networkFirst) {
            try {
                const response = await network();
                return response.ok ? response : (await cached()) || response;
            } catch { return (await cached()) || Response.error(); }
        }
        return (await cached()) || network();
    })());
});
