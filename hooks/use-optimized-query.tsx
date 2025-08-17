'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase as createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface QueryOptions {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  enableRealtime?: boolean
  cacheKey?: string
  debounceMs?: number
}

interface QueryResult<T> {
  data: T[] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  count: number | null
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useOptimizedQuery<T = any>(options: QueryOptions): QueryResult<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionRef = useRef<any>(null)

  const getCacheKey = useCallback(() => {
    if (options.cacheKey) return options.cacheKey
    return `${options.table}-${JSON.stringify(options.filters)}-${JSON.stringify(options.orderBy)}-${options.limit}`
  }, [options])

  const getFromCache = useCallback((key: string) => {
    const cached = queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  const setToCache = useCallback((key: string, data: any) => {
    queryCache.set(key, { data, timestamp: Date.now() })
  }, [])

  const executeQuery = useCallback(async () => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      setLoading(true)
      setError(null)

      // Check cache first
      const cacheKey = getCacheKey()
      const cachedData = getFromCache(cacheKey)
      if (cachedData) {
        setData(cachedData.data)
        setCount(cachedData.count)
        setLoading(false)
        return
      }

      // Build query
      const supabase = createSupabaseClient()
      let query: any = supabase
        .from(options.table)
        .select(options.select || '*', { count: 'exact' })

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        })
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data: result, error: queryError, count: resultCount } = await query

      if (queryError) {
        throw queryError
      }

      // Cache the result
      setToCache(cacheKey, { data: result, count: resultCount })
      
      setData(result)
      setCount(resultCount)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Query error:', err)
        setError(err.message || 'An error occurred while fetching data')
        toast.error('Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }, [options, getCacheKey, getFromCache, setToCache])

  const debouncedExecuteQuery = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      executeQuery()
    }, options.debounceMs || 300)
  }, [executeQuery, options.debounceMs])

  const refetch = useCallback(async () => {
    // Clear cache for this query
    const cacheKey = getCacheKey()
    queryCache.delete(cacheKey)
    await executeQuery()
  }, [executeQuery, getCacheKey])

  useEffect(() => {
    debouncedExecuteQuery()

    // Set up real-time subscription if enabled
    if (options.enableRealtime) {
      const supabaseForRealtime = createSupabaseClient()
      subscriptionRef.current = supabaseForRealtime
        .channel(`optimized-query-${options.table}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: options.table
        }, () => {
          // Invalidate cache and refetch
          const cacheKey = getCacheKey()
          queryCache.delete(cacheKey)
          executeQuery()
        })
        .subscribe()
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [debouncedExecuteQuery, options.enableRealtime, options.table, executeQuery, getCacheKey])

  return {
    data,
    loading,
    error,
    refetch,
    count
  }
}

// Hook for mutations with optimistic updates
export function useOptimizedMutation<T = any>(options: {
  table: string
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  invalidateQueries?: string[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (operation: 'insert' | 'update' | 'delete', data?: any, filters?: any) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createSupabaseClient()
      let query: any
      switch (operation) {
        case 'insert':
          query = supabase.from(options.table).insert(data).select()
          break
        case 'update':
          query = supabase.from(options.table).update(data)
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          query = query.select()
          break
        case 'delete':
          query = supabase.from(options.table).delete()
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          break
        default:
          throw new Error('Invalid operation')
      }

      const { data: result, error: mutationError } = await query

      if (mutationError) {
        throw mutationError
      }

      // Invalidate related caches
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryCache.delete(key)
        })
      }

      options.onSuccess?.(result)
      return result
    } catch (err: any) {
      console.error('Mutation error:', err)
      setError(err.message || 'An error occurred')
      options.onError?.(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    mutate,
    loading,
    error
  }
}

// Utility to clear all cache
export function clearQueryCache() {
  queryCache.clear()
}

// Utility to clear specific cache entries
export function clearCacheByPattern(pattern: string) {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  }
}