"use client"

import { useState, useEffect, useMemo } from 'react'
import { useMobileFirst } from './use-mobile-first'
import type { Casino } from '@/lib/types'

export function useCasinoMobileOptimization(casinos: Casino[], filter: string) {
  const { isMobile, isTablet } = useMobileFirst()
  const [visibleCount, setVisibleCount] = useState(6)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Mobile-optimized visible count
  const baseVisibleCount = useMemo(() => {
    if (isMobile) return 4
    if (isTablet) return 6
    return 8
  }, [isMobile, isTablet])

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(baseVisibleCount)
  }, [filter, baseVisibleCount])

  // Filter casinos based on current filter
  const filteredCasinos = useMemo(() => {
    if (!casinos) return []

    switch (filter) {
      case 'high-rated':
        return casinos.filter(casino => (casino.rating || 0) >= 7)
      case 'new':
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        return casinos.filter(casino => {
          if (!casino.created_at) return false
          return new Date(casino.created_at) > threeMonthsAgo
        })
      case 'live':
        return casinos.filter(casino => {
          const text = `${casino.description || ''} ${casino.bonus_info || ''} ${casino.name || ''}`.toLowerCase()
          return text.includes('live') || text.includes('dealer')
        })
      default:
        return casinos
    }
  }, [casinos, filter])

  // Get visible casinos for current view
  const visibleCasinos = useMemo(() => {
    return filteredCasinos.slice(0, visibleCount)
  }, [filteredCasinos, visibleCount])

  // Check if there are more casinos to load
  const hasMore = filteredCasinos.length > visibleCount

  // Load more function
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    setVisibleCount(prev => prev + (isMobile ? 3 : 6))
    setIsLoadingMore(false)
  }

  // Auto-load more on scroll (mobile only)
  useEffect(() => {
    if (!isMobile || !hasMore) return

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Load more when user is 200px from bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, hasMore, loadMore])

  return {
    visibleCasinos,
    filteredCasinos,
    hasMore,
    isLoadingMore,
    loadMore,
    visibleCount,
    totalCount: filteredCasinos.length,
  }
}
