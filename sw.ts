const version = '0.0.10'
// import { version } from '../package.json'

interface InstallEvent extends Event {
  waitUntil(promise: Promise<any>): void
}
interface FetchEvent extends InstallEvent {
  request: Request
  respondWith(promise?: Promise<Response | void> | Response): void
}

async function installer(event: InstallEvent) {
  const cache = await caches.open(version),
    images = [
      'android-chrome-192x192.png',
      'android-chrome-256x256.png',
      'apple-touch-icon.png',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'favicon.ico',
      'mstile-150x150.png',
      'safari-pinned-tab.svg',
    ]
  return cache.addAll(images)
}

async function fetcher(event: FetchEvent) {
  const cache = await caches.open(version)
  let response = await cache.match(event.request)
  if (response?.ok)
    event.waitUntil(cache.add(event.request))
  else {
    response = await fetch(event.request)
    if (response.ok)
      cache.put(event.request, response.clone())
  }
  return response
}

// @ts-ignore
addEventListener('install', (event: InstallEvent) => event.waitUntil(installer(event)))
// @ts-ignore
addEventListener('fetch', (event: FetchEvent) => event.request.method == 'GET' && event.respondWith(fetcher(event)))
