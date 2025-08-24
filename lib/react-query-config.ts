// Configuration utilities for mobile-first data management
// Optimized for performance and offline support

// Simple query client interface (without React Query dependency)
interface SimpleQueryClient {
  setDefaultOptions: (options: any) => void;
  setQueryData: (key: any, data: any) => void;
}

// Default stale time (5 minutes)
export const DEFAULT_STALE_TIME = 5 * 60 * 1000

// Default garbage collection time (10 minutes)
export const DEFAULT_GC_TIME = 10 * 60 * 1000

// Network retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 30000
}

// Query keys for consistent caching
export const QUERY_KEYS = {
  casinos: {
    all: ['casinos'] as const,
    lists: () => [...QUERY_KEYS.casinos.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...QUERY_KEYS.casinos.lists(), filters] as const,
    details: () => [...QUERY_KEYS.casinos.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.casinos.details(), id] as const,
    search: (query: string) => [...QUERY_KEYS.casinos.all, 'search', query] as const,
    featured: () => [...QUERY_KEYS.casinos.all, 'featured'] as const,
    favorites: () => [...QUERY_KEYS.casinos.all, 'favorites'] as const
  },
  reviews: {
    all: ['reviews'] as const,
    casino: (casinoId: string) => [...QUERY_KEYS.reviews.all, 'casino', casinoId] as const,
    user: (userId: string) => [...QUERY_KEYS.reviews.all, 'user', userId] as const
  },
  user: {
    profile: ['user', 'profile'] as const,
    preferences: ['user', 'preferences'] as const,
    favorites: ['user', 'favorites'] as const
  },
  stats: {
    casino: ['stats', 'casino'] as const,
    global: ['stats', 'global'] as const
  }
} as const

// Simple query client configuration (without React Query dependency)
export function createQueryClient(): SimpleQueryClient {
  const config = {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      retry: RETRY_CONFIG.maxAttempts,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online'
    },
    mutations: {
      retry: false,
      networkMode: 'online'
    }
  };

  return {
    setDefaultOptions: (options: any) => {
      Object.assign(config, options);
    },
    setQueryData: (key: any, data: any) => {
      // Simple implementation - in a real app this would update the cache
      console.log('Setting query data:', key, data);
    }
  };
}

// Custom hooks for casino queries
export function useCasinoQueries() {
  // This will be implemented in the hooks file
  return {
    // Query hooks will be defined here
  }
}

// Network status detection for offline support
export function createNetworkStatusQuery() {
  return {
    queryKey: ['network-status'],
    queryFn: () => {
      if (typeof navigator === 'undefined') return { online: true }

      return {
        online: navigator.onLine,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        saveData: (navigator as any).connection?.saveData || false
      }
    },
    staleTime: 1000, // Update every second
    refetchInterval: 5000, // Check every 5 seconds
    networkMode: 'always' // Always run, even offline
  }
}

// Performance monitoring utilities
export function createPerformanceMonitor() {
  return {
    onQueryStart: (queryKey: readonly unknown[]) => {
      if (typeof window === 'undefined') return

      const startTime = performance.now()
      console.log('Query started:', queryKey)

      return { startTime, queryKey }
    },

    onQueryEnd: (context: any, data: any, error?: Error) => {
      if (typeof window === 'undefined' || !context) return

      const duration = performance.now() - context.startTime
      const queryKey = context.queryKey

      console.log('Query completed:', queryKey, `(${duration.toFixed(2)}ms)`)

      // Track performance metrics (if analytics is available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'query_performance', {
          event_category: 'Performance',
          event_label: Array.isArray(queryKey) ? queryKey.join('_') : String(queryKey),
          value: Math.round(duration),
          custom_parameter_1: error ? 'error' : 'success',
          custom_parameter_2: data ? 'with_data' : 'no_data'
        })
      }
    }
  }
}

// Query persistence configuration
export const PERSISTENCE_CONFIG = {
  // Queries that should be persisted across sessions
  persistable: [
    QUERY_KEYS.casinos.featured,
    QUERY_KEYS.stats.global,
    QUERY_KEYS.user.profile
  ],

  // Storage configuration
  storage: {
    getItem: (key: string) => {
      if (typeof localStorage === 'undefined') return null
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },

    setItem: (key: string, value: string) => {
      if (typeof localStorage === 'undefined') return
      try {
        localStorage.setItem(key, value)
      } catch {
        // Handle storage quota exceeded
        console.warn('Storage quota exceeded')
      }
    },

    removeItem: (key: string) => {
      if (typeof localStorage === 'undefined') return
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore errors
      }
    }
  },

  // Serialization options
  serialize: (data: any) => JSON.stringify(data),
  deserialize: (data: string) => JSON.parse(data),

  // Expiration (24 hours)
  maxAge: 24 * 60 * 60 * 1000
}

// Background refetch configuration
export const BACKGROUND_REFETCH_CONFIG = {
  // Refetch intervals for different query types
  intervals: {
    [QUERY_KEYS.casinos.featured().join('.')]: 30 * 60 * 1000, // 30 minutes
    [QUERY_KEYS.stats.global[1]]: 60 * 60 * 1000,     // 1 hour
    [QUERY_KEYS.casinos.all[0]]: 15 * 60 * 1000       // 15 minutes
  },

  // Only refetch when app is visible and online
  conditions: {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    networkMode: 'online' as const
  }
}

// Simple update utilities (without React Query dependency)
export const simpleUpdates = {
  // Casino favorite toggle (simple implementation)
  toggleFavorite: (casinoId: string, newState: boolean) => {
    console.log('Toggle favorite:', casinoId, newState);
    // In a real app, this would update local state or cache
    return { casinoId, newState };
  },

  // Casino rating update (simple implementation)
  updateRating: (casinoId: string, newRating: number) => {
    console.log('Update rating:', casinoId, newRating);
    // In a real app, this would update local state or cache
    return { casinoId, newRating };
  }
}
