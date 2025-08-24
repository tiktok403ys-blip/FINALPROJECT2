// Service Worker untuk PWA dan caching optimization
const CACHE_NAME = 'casino-app-v1.0.0'
const STATIC_CACHE = 'casino-static-v1.0.0'
const DYNAMIC_CACHE = 'casino-dynamic-v1.0.0'
const API_CACHE = 'casino-api-v1.0.0'

// Resources untuk cache static - Critical for mobile performance
const STATIC_ASSETS = [
  '/',
  '/casinos',
  '/globals.css',
  '/favicon.ico',
  // Add other critical assets
]

// Install event - Cache static assets immediately
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...', CACHE_NAME)

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)

      try {
        // Cache static assets
        await cache.addAll(STATIC_ASSETS)
        console.log('✅ Service Worker: Static assets cached')

        // Cache critical fonts and icons
        const criticalAssets = [
          '/fonts/inter.woff2',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ].filter(url => STATIC_ASSETS.some(asset => !url.includes(asset)))

        if (criticalAssets.length > 0) {
          await cache.addAll(criticalAssets)
          console.log('✅ Service Worker: Critical assets cached')
        }

      } catch (error) {
        console.warn('⚠️ Service Worker: Some assets failed to cache:', error)
        // Continue with installation even if some assets fail
      }

      // Force activation of new service worker
      await self.skipWaiting()
    })()
  )
})

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker: Activating...', CACHE_NAME)

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(cacheName =>
        cacheName !== STATIC_CACHE &&
        cacheName !== DYNAMIC_CACHE &&
        cacheName !== API_CACHE
      )

      if (oldCaches.length > 0) {
        console.log('🗑️ Service Worker: Deleting old caches:', oldCaches)
        await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)))
      }

      // Claim all clients
      await clients.claim()
      console.log('✅ Service Worker: Activated and claimed clients')
    })()
  )
})

// Fetch event - Intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isSameOrigin = url.origin === location.origin

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Handle different request types
  if (isSameOrigin) {
    if (url.pathname.startsWith('/api/')) {
      // API requests - Network first with cache fallback
      handleApiRequest(event)
    } else if (STATIC_ASSETS.includes(url.pathname) ||
               url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/)) {
      // Static assets - Cache first strategy
      handleStaticAsset(event)
    } else {
      // Pages - Network first for fresh content
      handlePageRequest(event)
    }
  } else {
    // External resources - Cache if successful
    handleExternalResource(event)
  }
})

// Handle API requests with intelligent caching
async function handleApiRequest(event) {
  const url = new URL(event.request.url)

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const response = await fetch(event.request)
        const cache = await caches.open(API_CACHE)

        if (response.ok) {
          // Cache successful API responses
          const responseClone = response.clone()

          // Add cache headers for better cache management
          const enhancedResponse = new Response(responseClone.body, {
            ...responseClone,
            headers: {
              ...responseClone.headers,
              'sw-cache-time': Date.now().toString(),
              'sw-cache-strategy': 'api-network-first'
            }
          })

          await cache.put(event.request, enhancedResponse)
          console.log('💾 API cached:', url.pathname)
        }

        return response
      } catch (error) {
        console.log('🌐 API network failed, trying cache:', url.pathname)

        // Fallback to cache
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          console.log('📦 API served from cache:', url.pathname)
          return cachedResponse
        }

        // If no cache and offline, return offline page
        if (!navigator.onLine) {
          return new Response(
            JSON.stringify({
              error: 'Offline',
              message: 'Content not available offline',
              offline: true
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
              statusText: 'Service Unavailable'
            }
          )
        }

        throw error
      }
    })()
  )
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(event) {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request)

      if (cachedResponse) {
        // Return cached version immediately
        console.log('⚡ Static asset from cache:', event.request.url)

        // Update cache in background for next time
        fetch(event.request)
          .then(async (response) => {
            if (response.ok) {
              const cache = await caches.open(STATIC_CACHE)
              await cache.put(event.request, response.clone())
              console.log('🔄 Static asset updated:', event.request.url)
            }
          })
          .catch(() => {
            // Silent fail for background updates
          })

        return cachedResponse
      }

      // No cache, fetch from network
      try {
        const response = await fetch(event.request)
        const cache = await caches.open(STATIC_CACHE)

        if (response.ok) {
          await cache.put(event.request, response.clone())
          console.log('💾 Static asset cached:', event.request.url)
        }

        return response
      } catch (error) {
        console.error('❌ Static asset fetch failed:', event.request.url, error)
        throw error
      }
    })()
  )
}

// Handle page requests with network-first strategy
async function handlePageRequest(event) {
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request)

        if (response.ok) {
          // Cache pages for offline access
          const cache = await caches.open(DYNAMIC_CACHE)
          await cache.put(event.request, response.clone())
          console.log('📄 Page cached:', event.request.url)
        }

        return response
      } catch (error) {
        console.log('🌐 Page network failed, trying cache:', event.request.url)

        // Try cache fallback
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          console.log('📦 Page served from cache:', event.request.url)
          return cachedResponse
        }

        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match('/')
          if (offlinePage) {
            return offlinePage
          }
        }

        throw error
      }
    })()
  )
}

// Handle external resources
async function handleExternalResource(event) {
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request)

        // Cache successful external resources
        if (response.ok && response.status === 200) {
          const cache = await caches.open(DYNAMIC_CACHE)
          await cache.put(event.request, response.clone())
          console.log('🌍 External resource cached:', event.request.url)
        }

        return response
      } catch (error) {
        // Try cache for external resources
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          console.log('📦 External resource from cache:', event.request.url)
          return cachedResponse
        }

        throw error
      }
    })()
  )
}

// Background sync untuk offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('🔄 Service Worker: Performing background sync')

  try {
    // Implement background sync logic here
    // e.g., sync favorite casinos, user preferences, etc.
    console.log('✅ Background sync completed')
  } catch (error) {
    console.error('❌ Background sync failed:', error)
  }
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push received', event.data?.text())

  const options = {
    body: event.data?.text() || 'New casino updates available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Updates',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('GuruSingapore Updates', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked')

  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url.includes('/casinos') && 'focus' in client) {
            return client.focus()
          }
        }

        if (clients.openWindow) {
          return clients.openWindow('/casinos')
        }
      })
  )
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then(cacheNames => {
      const cacheInfo = {}

      return Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName)
          const keys = await cache.keys()
          cacheInfo[cacheName] = {
            name: cacheName,
            count: keys.length,
            size: 'unknown' // Would need to calculate actual size
          }
        })
      ).then(() => {
        event.ports[0].postMessage(cacheInfo)
      })
    })
  }
})

// Cache cleanup - Remove old entries
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCache())
  }
})

async function cleanupCache() {
  console.log('🧹 Service Worker: Cleaning up cache')

  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const keys = await cache.keys()

    // Remove entries older than 7 days
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)

    let removed = 0
    for (const request of keys) {
      try {
        const response = await cache.match(request)
        if (response) {
          const cacheTime = response.headers.get('sw-cache-time')
          if (cacheTime && parseInt(cacheTime) < cutoff) {
            await cache.delete(request)
            removed++
          }
        }
      } catch (error) {
        // Continue cleanup even if individual items fail
        console.warn('Cache cleanup item failed:', request.url, error)
      }
    }

    console.log(`🧹 Cache cleanup completed: ${removed} items removed`)

    // Send result back to main thread
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ removed })
    }
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error)
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('🚨 Service Worker Error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Service Worker Unhandled Rejection:', event.reason)
})
