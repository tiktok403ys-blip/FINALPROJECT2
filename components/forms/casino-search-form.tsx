"use client"

import { useState, useTransition, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import { GlassCard } from '@/components/glass-card'
import { useCasinoStore } from '@/lib/store/casino-store'
import { trackEvent } from '@/lib/analytics'
import { useRouter, useSearchParams } from 'next/navigation'

// Form validation schema
const searchSchema = z.object({
  query: z.string().min(0).max(100, 'Search query too long'),
  filter: z.enum(['all', 'high-rated', 'new', 'live']).optional(),
  sortBy: z.enum(['rating', 'newest', 'name', 'relevance']).optional()
})

type SearchFormData = z.infer<typeof searchSchema>

interface CasinoSearchFormProps {
  onSearch?: (data: SearchFormData) => void
  showFilters?: boolean
  compact?: boolean
}

export function CasinoSearchForm({ onSearch, showFilters = true, compact = false }: CasinoSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state: { filters: currentFilters }, actions: { setFilters } } = useCasinoStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: currentFilters.query || searchParams.get('q') || '',
      filter: (currentFilters.filter as any) || searchParams.get('filter') || 'all',
      sortBy: (currentFilters.sortBy as any) || searchParams.get('sort') || 'rating'
    }
  })

  const watchedQuery = watch('query')
  const watchedFilter = watch('filter')
  const watchedSortBy = watch('sortBy')

  // Track search interactions
  useEffect(() => {
    if (watchedQuery.length > 0) {
      trackEvent({
        action: 'search_query_typed',
        category: 'Search',
        label: 'casino_search',
        customParameters: {
          query_length: watchedQuery.length,
          has_filters: showFilters
        }
      })
    }
  }, [watchedQuery, showFilters])

  // Handle real-time search (debounced)
  useEffect(() => {
    if (!watchedQuery) return

    const timeoutId = setTimeout(() => {
      if (watchedQuery.length >= 2) {
        handleSearch({
          query: watchedQuery,
          filter: watchedFilter,
          sortBy: watchedSortBy
        })
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [watchedQuery, watchedFilter, watchedSortBy])

  const handleSearch = (data: SearchFormData) => {
    startTransition(async () => {
      try {
        // Update local state
        setFilters({
          query: data.query,
          filter: data.filter || 'all',
          sortBy: data.sortBy || 'rating'
        })

        // Track search event
        trackEvent({
          action: 'casino_search_performed',
          category: 'Search',
          label: data.query || 'empty_query',
          customParameters: {
            query: data.query,
            filter_applied: data.filter || 'none',
            sort_by: data.sortBy || 'default',
            search_source: 'form'
          }
        })

        // Update URL for better UX and shareability
        const params = new URLSearchParams(searchParams)
        if (data.query) {
          params.set('q', data.query)
        } else {
          params.delete('q')
        }

        if (data.filter && data.filter !== 'all') {
          params.set('filter', data.filter)
        } else {
          params.delete('filter')
        }

        if (data.sortBy && data.sortBy !== 'rating') {
          params.set('sort', data.sortBy)
        } else {
          params.delete('sort')
        }

        const newUrl = `?${params.toString()}`
        router.replace(newUrl, { scroll: false })

        // Call custom onSearch handler
        onSearch?.(data)

      } catch (error) {
        console.error('Search error:', error)
      }
    })
  }

  const clearSearch = () => {
    reset({
      query: '',
      filter: 'all',
      sortBy: 'rating'
    })

    setFilters({
      query: '',
      filter: 'all',
      sortBy: 'rating'
    })

    // Clear URL parameters
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    params.delete('filter')
    params.delete('sort')
    router.replace(`?${params.toString()}`, { scroll: false })

    // Focus back to search input
    searchInputRef.current?.focus()

    trackEvent({
      action: 'search_cleared',
      category: 'Search',
      label: 'casino_search'
    })
  }

  const toggleFilters = () => {
    setIsExpanded(!isExpanded)
    trackEvent({
      action: isExpanded ? 'filters_collapsed' : 'filters_expanded',
      category: 'Search',
      label: 'casino_search'
    })
  }

  if (compact) {
    return (
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            {...register('query')}
            ref={searchInputRef}
            placeholder="Search casinos..."
            className="pl-10 pr-10 bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(handleSearch)()
              }
            }}
          />
          {watchedQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <GlassCard className="p-4">
      <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            {...register('query')}
            ref={searchInputRef}
            placeholder="Search casinos by name, features, or bonuses..."
            className="pl-11 pr-12 py-3 text-lg bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
            disabled={isPending}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {watchedQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isPending}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {showFilters && (
              <button
                type="button"
                onClick={toggleFilters}
                className={`p-1 rounded transition-colors ${
                  isExpanded
                    ? 'text-[#00ff88] bg-[#00ff88]/10'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={isPending}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg border border-white/10">
            {/* Filter Select */}
            <div>
              <Label className="text-white text-sm font-medium mb-2 block">
                Filter
              </Label>
              <Select
                value={watchedFilter}
                onValueChange={(value) => setValue('filter', value as any)}
                disabled={isPending}
              >
                <SelectTrigger className="bg-black/50 border-white/20 text-white focus:border-[#00ff88] focus:ring-[#00ff88]/20">
                  <SelectValue placeholder="All casinos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    All Casinos
                  </SelectItem>
                  <SelectItem value="high-rated" className="text-white hover:bg-white/10">
                    High Rated (7+)
                  </SelectItem>
                  <SelectItem value="new" className="text-white hover:bg-white/10">
                    New Casinos
                  </SelectItem>
                  <SelectItem value="live" className="text-white hover:bg-white/10">
                    Live Dealer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Select */}
            <div>
              <Label className="text-white text-sm font-medium mb-2 block">
                Sort by
              </Label>
              <Select
                value={watchedSortBy}
                onValueChange={(value) => setValue('sortBy', value as any)}
                disabled={isPending}
              >
                <SelectTrigger className="bg-black/50 border-white/20 text-white focus:border-[#00ff88] focus:ring-[#00ff88]/20">
                  <SelectValue placeholder="Sort by rating" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="rating" className="text-white hover:bg-white/10">
                    Highest Rating
                  </SelectItem>
                  <SelectItem value="newest" className="text-white hover:bg-white/10">
                    Newest First
                  </SelectItem>
                  <SelectItem value="name" className="text-white hover:bg-white/10">
                    Name (A-Z)
                  </SelectItem>
                  <SelectItem value="relevance" className="text-white hover:bg-white/10">
                    Relevance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {watchedQuery && (
              <span>Searching for &quot;{watchedQuery}&quot;</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {watchedQuery && (
              <Button
                type="button"
                onClick={clearSearch}
                variant="outline"
                size="sm"
                className="border-white/20 text-gray-300 hover:bg-white/10"
                disabled={isPending}
              >
                Clear
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-medium px-6"
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errors.query && (
          <p className="text-red-400 text-sm">{errors.query.message}</p>
        )}
      </form>
    </GlassCard>
  )
}

// Quick search component for mobile
export function CasinoQuickSearch({ onSearch }: { onSearch?: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const { actions: { applySearch } } = useCasinoStore()

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    applySearch(searchQuery)
    onSearch?.(searchQuery)

    trackEvent({
      action: 'quick_search_used',
      category: 'Search',
      label: searchQuery,
      customParameters: {
        search_type: 'quick',
        query: searchQuery
      }
    })
  }

  const quickSearches = [
    'Live Dealer',
    'High Roller',
    'Bitcoin',
    'No Deposit',
    'Mobile Apps',
    'Fast Payouts'
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickSearches.map((searchTerm) => (
          <Button
            key={searchTerm}
            onClick={() => handleQuickSearch(searchTerm)}
            variant="outline"
            size="sm"
            className="text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/10"
          >
            {searchTerm}
          </Button>
        ))}
      </div>

      {query && (
        <div className="text-sm text-gray-400">
          Searching for: <span className="text-[#00ff88] font-medium">&quot;{query}&quot;</span>
        </div>
      )}
    </div>
  )
}
