const version = '0.0.10';
async function installer(event) {
    const cache = await caches.open(version), images = [
        'android-chrome-192x192.png',
        'android-chrome-256x256.png',
        'apple-touch-icon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon.ico',
        'mstile-150x150.png',
        'safari-pinned-tab.svg',
    ];
    return cache.addAll(images);
}
async function fetcher(event) {
    const cache = await caches.open(version);
    let response = await cache.match(event.request);
    if (response?.ok) // cache hit
        event.waitUntil(cache.add(event.request));
    else { // cache miss
        response = await fetch(event.request);
        if (response.ok)
            cache.put(event.request, response.clone());
        // else
        // throw Error(`Failed to fetch & cache "${event.request.url}": ${response.status}`)
    }
    return response;
}
// @ts-ignore
addEventListener('install', (event) => event.waitUntil(installer(event)));
// @ts-ignore
addEventListener('fetch', (event) => event.request.method == 'GET' && event.respondWith(fetcher(event)));
