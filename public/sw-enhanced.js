// Enhanced Service Worker for PWA and offline support
// Optimized for casino app with advanced caching strategies

const CACHE_NAME = 'casino-app-v1.2.0'
const STATIC_CACHE = 'casino-static-v1.2.0'
const DYNAMIC_CACHE = 'casino-dynamic-v1.2.0'
const IMAGES_CACHE = 'casino-images-v1.2.0'
const API_CACHE = 'casino-api-v1.2.0'

// Cache configuration
const CACHE_CONFIG = {
  maxStaticCacheSize: 50,
  maxDynamicCacheSize: 100,
  maxImageCacheSize: 200,
  maxApiCacheSize: 50,
  apiCacheDuration: 5 * 60 * 1000, // 5 minutes
  imageCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
}

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/casinos',
  '/bonuses',
  '/news',
  '/reports',
  '/about',
  '/privacy',
  '/terms',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo-gurusingapore.png',
  '/hero-phone-mockup.png',
  '/casino-chips.png',
  '/casino-interior.png',
  '/placeholder.jpg',
  '/placeholder-logo.png',
  '/placeholder-user.jpg'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/casinos',
  '/api/bonuses',
  '/api/news',
  '/api/stats'
]

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|gif|svg|webp)$/,
  /\/api\/.*\.(?:png|jpg|jpeg|gif|svg|webp)$/,
  /\/logos\//,
  /\/screenshots\//
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE)

        // Cache static assets with error handling
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            })

            if (response.ok) {
              await cache.put(asset, response)
              console.log(`[SW] Cached: ${asset}`)
            } else {
              console.warn(`[SW] Failed to cache: ${asset} (${response.status})`)
            }
          } catch (error) {
            console.warn(`[SW] Error caching ${asset}:`, error)
          }
        })

        await Promise.all(cachePromises)
        console.log('[SW] Static assets cached successfully')

      } catch (error) {
        console.error('[SW] Install failed:', error)
      }
    })()
  )

  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')

  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys()

        // Delete old caches
        const deletePromises = cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGES_CACHE && name !== API_CACHE)
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`)
            return caches.delete(name)
          })

        await Promise.all(deletePromises)

        // Clean up oversized caches
        await cleanupCache(STATIC_CACHE, CACHE_CONFIG.maxStaticCacheSize)
        await cleanupCache(DYNAMIC_CACHE, CACHE_CONFIG.maxDynamicCacheSize)
        await cleanupCache(IMAGES_CACHE, CACHE_CONFIG.maxImageCacheSize)
        await cleanupCache(API_CACHE, CACHE_CONFIG.maxApiCacheSize)

        console.log('[SW] Cache cleanup completed')

      } catch (error) {
        console.error('[SW] Activate failed:', error)
      }
    })()
  )

  // Claim all clients
  self.clients.claim()
})

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip browser extensions and external requests
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return
  if (url.hostname === 'chrome-extension') return

  event.respondWith(
    (async () => {
      try {
        // Handle different types of requests
        if (isApiRequest(url)) {
          return handleApiRequest(event.request)
        } else if (isImageRequest(url)) {
          return handleImageRequest(event.request)
        } else if (isStaticAsset(url)) {
          return handleStaticRequest(event.request)
        } else {
          return handleDynamicRequest(event.request)
        }
      } catch (error) {
        console.error('[SW] Fetch error:', error)
        return new Response('Offline - Content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      }
    })()
  )
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  event.waitUntil(
    (async () => {
      try {
        if (event.tag === 'background-fetch') {
          await performBackgroundSync()
        } else if (event.tag === 'cache-cleanup') {
          await cleanupAllCaches()
        }
      } catch (error) {
        console.error('[SW] Background sync failed:', error)
      }
    })()
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text())

  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || 'New casino updates available!',
    icon: '/logo-gurusingapore.png',
    badge: '/logo-gurusingapore.png',
    image: data.image || '/hero-phone-mockup.png',
    data: {
      url: data.url || '/',
      casinoId: data.casinoId
    },
    actions: [
      {
        action: 'view',
        title: 'View Casino',
        icon: '/placeholder.jpg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false,
    tag: data.tag || 'casino-notification',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'GuruSingapore', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action)

  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Helper functions
function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint)) ||
         url.pathname.includes('/api/')
}

function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.startsWith('/_next/static/')
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE)
      const responseClone = networkResponse.clone()

      // Add timestamp for cache expiration
      const responseWithTimestamp = new Response(responseClone.body, {
        ...responseClone,
        headers: {
          ...responseClone.headers,
          'x-cache-timestamp': Date.now().toString()
        }
      })

      cache.put(request, responseWithTimestamp)
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache')
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Check if cache is still fresh
    const timestamp = cachedResponse.headers.get('x-cache-timestamp')
    if (timestamp && (Date.now() - parseInt(timestamp)) < CACHE_CONFIG.apiCacheDuration) {
      return cachedResponse
    }
  }

  return new Response(JSON.stringify({ error: 'Offline - API not available' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Check if cache is still fresh
    const timestamp = cachedResponse.headers.get('x-cache-timestamp')
    if (timestamp && (Date.now() - parseInt(timestamp)) < CACHE_CONFIG.imageCacheDuration) {
      return cachedResponse
    }
  }

  try {
    // Try network
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(IMAGES_CACHE)
      const responseClone = networkResponse.clone()

      // Add timestamp for cache expiration
      const responseWithTimestamp = new Response(responseClone.body, {
        ...responseClone,
        headers: {
          ...responseClone.headers,
          'x-cache-timestamp': Date.now().toString()
        }
      })

      cache.put(request, responseWithTimestamp)
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed for image request')
  }

  // Return cached version even if stale
  if (cachedResponse) {
    return cachedResponse
  }

  return new Response('Image not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  })
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed for static request')
  }

  return new Response('Asset not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  })
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Cache dynamic content for offline use
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed for dynamic request, trying cache')
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }
  }

  return new Response('Content not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  })
}

// Cache cleanup utilities
async function cleanupCache(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()

    if (keys.length > maxSize) {
      const deleteCount = keys.length - maxSize
      const keysToDelete = keys.slice(0, deleteCount)

      await Promise.all(keysToDelete.map(key => cache.delete(key)))

      console.log(`[SW] Cleaned up ${deleteCount} items from ${cacheName}`)
    }
  } catch (error) {
    console.error(`[SW] Cache cleanup failed for ${cacheName}:`, error)
  }
}

async function cleanupAllCaches() {
  await Promise.all([
    cleanupCache(STATIC_CACHE, CACHE_CONFIG.maxStaticCacheSize),
    cleanupCache(DYNAMIC_CACHE, CACHE_CONFIG.maxDynamicCacheSize),
    cleanupCache(IMAGES_CACHE, CACHE_CONFIG.maxImageCacheSize),
    cleanupCache(API_CACHE, CACHE_CONFIG.maxApiCacheSize)
  ])
}

// Background sync operations
async function performBackgroundSync() {
  try {
    // Get pending operations from IndexedDB or similar
    // For now, just log the sync attempt
    console.log('[SW] Performing background sync')

    // You would implement actual sync logic here
    // For example, retry failed API calls, sync offline data, etc.

  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_DATA') {
    // Handle performance data from main thread
    console.log('[SW] Performance data received:', event.data.payload)
  }
})

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
})
