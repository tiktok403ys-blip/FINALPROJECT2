// Supabase configuration optimized for mobile-first design
// Enhanced for performance, offline support, and mobile-specific features

import { createClient } from '@supabase/supabase-js'

// Simple database interface for mobile optimization
interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
  }
}

// Mobile-optimized Supabase configuration
const mobileSupabaseConfig = {
  // Connection settings optimized for mobile networks
  global: {
    headers: {
      'x-client-info': 'supabase-js-mobile',
      'x-mobile-optimized': 'true'
    }
  },

  // Database settings for mobile
  db: {
    schema: 'public' as const,
  },

  // Realtime settings optimized for mobile
  realtime: {
    params: {
      eventsPerSecond: 10, // Reduce for mobile bandwidth
    },
  },

  // Auth settings for mobile
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile apps
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.mobile.auth.token',
    flowType: 'pkce' as const // Use PKCE for mobile security
  }
}

// Create mobile-optimized Supabase client
export function createMobileOptimizedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, mobileSupabaseConfig)
}

// Mobile-specific query optimization
export const mobileQueryConfig = {
  // Pagination optimized for mobile
  defaultPageSize: 12, // Smaller pages for mobile
  maxPageSize: 24,

  // Caching configuration
  cacheTime: 5 * 60 * 1000, // 5 minutes for mobile
  staleTime: 2 * 60 * 1000, // 2 minutes

  // Retry configuration for mobile networks
  retryAttempts: 2,
  retryDelay: 1000,

  // Connection timeout for mobile
  timeout: 15000 // 15 seconds
}

// Mobile-optimized database functions
export class MobileOptimizedSupabase {
  private client: ReturnType<typeof createMobileOptimizedClient>

  constructor() {
    this.client = createMobileOptimizedClient()
  }

  // Optimized casino query for mobile
  async getCasinosOptimized(options: {
    filter?: 'all' | 'high-rated' | 'new' | 'live'
    page?: number
    limit?: number
    includeStats?: boolean
  } = {}) {
    const {
      filter = 'all',
      page = 1,
      limit = mobileQueryConfig.defaultPageSize,
      includeStats = false
    } = options

    const offset = (page - 1) * limit

    let query = this.client
      .from('casinos')
      .select(`
        id,
        name,
        logo_url,
        rating,
        established_year,
        description,
        bonus_info,
        website_url,
        created_at,
        updated_at,
        display_order,
        is_featured_home,
        home_rank,
        is_active,
        ${includeStats ? 'player_reviews(count), casino_images(url)' : ''}
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)

    // Apply filters
    if (filter === 'high-rated') {
      query = query.gte('rating', 7)
    } else if (filter === 'new') {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      query = query.gte('created_at', threeMonthsAgo.toISOString())
    } else if (filter === 'live') {
      query = query.or('description.ilike.%live%,bonus_info.ilike.%live%,name.ilike.%live%')
    }

    // Optimized ordering for mobile
    query = query
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Mobile optimized casino query error:', error)
      throw error
    }

    return data || []
  }

  // Get casino with mobile optimizations
  async getCasinoByIdOptimized(id: string, includeReviews = false) {
    const selectFields = `
      id,
      name,
      logo_url,
      rating,
      established_year,
      description,
      bonus_info,
      website_url,
      created_at,
      updated_at,
      display_order,
      is_featured_home,
      home_rank,
      is_active,
      ${includeReviews ? 'player_reviews(*)' : ''}
    `

    const { data, error } = await this.client
      .from('casinos')
      .select(selectFields)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Mobile optimized casino fetch error:', error)
      throw error
    }

    return data
  }

  // Search casinos with mobile optimizations
  async searchCasinosOptimized(searchQuery: string, options: {
    filter?: string
    limit?: number
    includeStats?: boolean
  } = {}) {
    const { filter = 'all', limit = 10, includeStats = false } = options

    if (!searchQuery || searchQuery.length < 2) {
      return []
    }

    let query = this.client
      .from('casinos')
      .select(`
        id,
        name,
        logo_url,
        rating,
        description,
        bonus_info,
        ${includeStats ? 'player_reviews(count)' : ''}
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,bonus_info.ilike.%${searchQuery}%`)

    // Apply filter
    if (filter === 'high-rated') {
      query = query.gte('rating', 7)
    } else if (filter === 'live') {
      query = query.or('description.ilike.%live%,bonus_info.ilike.%live%')
    }

    query = query
      .order('rating', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Mobile optimized search error:', error)
      throw error
    }

    return data || []
  }

  // Get user favorites with mobile optimizations
  async getUserFavoritesOptimized(userId: string) {
    const { data, error } = await this.client
      .from('user_favorites')
      .select(`
        casino_id,
        created_at,
        casinos (
          id,
          name,
          logo_url,
          rating,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Mobile optimized favorites error:', error)
      throw error
    }

    return data || []
  }

  // Toggle favorite with optimistic updates
  async toggleFavoriteOptimized(casinoId: string, userId: string) {
    // Check if already favorited
    const { data: existing } = await this.client
      .from('user_favorites')
      .select('id')
      .eq('casino_id', casinoId)
      .eq('user_id', userId)
      .single()

    if (existing && 'id' in existing) {
      // Remove favorite
      const { error } = await this.client
        .from('user_favorites')
        .delete()
        .eq('id', (existing as any).id)

      if (error) throw error
      return { favorited: false }
    } else {
      // Add favorite
      const { error } = await this.client
        .from('user_favorites')
        .insert({
          casino_id: casinoId,
          user_id: userId
        })

      if (error) throw error
      return { favorited: true }
    }
  }

  // Submit review with mobile optimizations
  async submitReviewOptimized(reviewData: {
    casinoId: string
    userId: string
    rating: number
    title: string
    content: string
    pros?: string[]
    cons?: string[]
  }) {
    const { data, error } = await this.client
      .from('player_reviews')
      .insert({
        casino_id: reviewData.casinoId,
        user_id: reviewData.userId,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Mobile optimized review submission error:', error)
      throw error
    }

    return data
  }

  // Realtime subscription optimized for mobile
  subscribeToCasinoUpdates(casinoId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`casino-${casinoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'casinos',
          filter: `id=eq.${casinoId}`
        },
        callback
      )
      .subscribe()
  }

  // Batch operations for mobile
  async batchOperations(operations: Array<{
    type: 'insert' | 'update' | 'delete'
    table: string
    data: any
    condition?: any
  }>) {
    const results = []

    for (const operation of operations) {
      try {
        let query = this.client.from(operation.table)

        switch (operation.type) {
          case 'insert':
            query = (query as any).insert(operation.data)
            break
          case 'update':
            query = (query as any).update(operation.data)
            if (operation.condition) {
              Object.entries(operation.condition).forEach(([key, value]) => {
                query = (query as any).eq(key, value)
              })
            }
            break
          case 'delete':
            if (operation.condition) {
              Object.entries(operation.condition).forEach(([key, value]) => {
                query = (query as any).eq(key, value)
              })
            }
            query = (query as any).delete()
            break
        }

        const { data, error } = await (query as any)
        results.push({ success: !error, data, error })

      } catch (error) {
        results.push({ success: false, error })
      }
    }

    return results
  }

  // Health check for mobile connectivity
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('casinos')
        .select('id')
        .limit(1)

      return {
        success: !error,
        latency: Date.now(),
        error: error?.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const mobileSupabase = new MobileOptimizedSupabase()

// Utility functions for mobile optimization
export const mobileUtils = {
  // Check network quality
  async getNetworkQuality(): Promise<'slow' | 'fast' | 'unknown'> {
    if (typeof navigator === 'undefined') return 'unknown'

    const connection = (navigator as any).connection
    if (!connection) return 'unknown'

    const effectiveType = connection.effectiveType
    const saveData = connection.saveData

    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow'
    }

    return 'fast'
  },

  // Get device memory info
  getDeviceMemory(): number {
    if (typeof navigator === 'undefined') return 0
    return (navigator as any).deviceMemory || 0
  },

  // Check if device supports WebP
  async supportsWebP(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
    })
  },

  // Get optimal image size for device
  getOptimalImageSize(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      return { width: 640, height: 360 }
    }

    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const devicePixelRatio = window.devicePixelRatio || 1

    return {
      width: Math.min(screenWidth * devicePixelRatio, 1920),
      height: Math.min(screenHeight * devicePixelRatio, 1080)
    }
  }
}
