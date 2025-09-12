"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react"
import type { Bonus, Casino } from "@/lib/types"

interface FilterState {
  search: string
  bonusType: string
  casino: string
  minAmount: number
  maxAmount: number
  wagering: string
  features: {
    noDeposit: boolean
    freeSpins: boolean
    exclusive: boolean
  }
  sortBy: string
}

interface BonusFilterProps {
  bonuses: (Bonus & { casinos?: Casino })[] 
  onFilterChange: (filteredBonuses: (Bonus & { casinos?: Casino })[]) => void
  className?: string
}

const BONUS_TYPES = [
  { value: "all", label: "All Types" },
  { value: "welcome", label: "Welcome Bonus" },
  { value: "no deposit", label: "No Deposit" },
  { value: "free spins", label: "Free Spins" },
  { value: "reload", label: "Reload Bonus" },
  { value: "cashback", label: "Cashback" },
  { value: "vip", label: "VIP Bonus" },
  { value: "tournament", label: "Tournament" },
  { value: "loyalty", label: "Loyalty Reward" }
]

const WAGERING_RANGES = [
  { value: "all", label: "All Wagering" },
  { value: "low", label: "Low (1-25x)" },
  { value: "medium", label: "Medium (26-40x)" },
  { value: "high", label: "High (40x+)" }
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "amount_high", label: "Highest Amount" },
  { value: "amount_low", label: "Lowest Amount" },
  { value: "wagering_low", label: "Lowest Wagering" },
  { value: "expiring", label: "Expiring Soon" }
]

export function BonusFilter({ bonuses, onFilterChange, className }: BonusFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    bonusType: "all",
    casino: "all",
    minAmount: 0,
    maxAmount: 10000,
    wagering: "all",
    features: {
      noDeposit: false,
      freeSpins: false,
      exclusive: false
    },
    sortBy: "newest"
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search to improve performance
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 300)
  }, [])

  // Memoized unique casinos for performance with safety checks
  const uniqueCasinos = useMemo(() => {
    try {
      if (!Array.isArray(bonuses) || bonuses.length === 0) {
        return []
      }
      return Array.from(
        new Set(
          bonuses
            .filter(bonus => bonus && typeof bonus === 'object')
            .map(bonus => bonus.casinos?.name)
            .filter(Boolean)
        )
      ).map(name => ({ 
        value: name!.toLowerCase(), 
        label: name! 
      }))
    } catch (error) {
      console.warn('Error processing unique casinos:', error)
      return []
    }
  }, [bonuses])

  const casinoOptions = [
    { value: "all", label: "All Casinos" },
    ...uniqueCasinos
  ]

  // Filter and sort bonuses with error handling
  useEffect(() => {
    try {
      // Defensive check for bonuses array
      if (!Array.isArray(bonuses) || bonuses.length === 0) {
        onFilterChange([])
        return
      }

      // Safe array spread with validation
      let filtered = bonuses.filter(bonus => bonus && typeof bonus === 'object')

      // Search filter with defensive programming
      if (filters.search && typeof filters.search === 'string') {
        const searchTerm = filters.search.toLowerCase().trim()
        if (searchTerm) {
          filtered = filtered.filter(bonus => {
            try {
              return (
                (bonus?.title || '').toLowerCase().includes(searchTerm) ||
                (bonus?.description || '').toLowerCase().includes(searchTerm) ||
                (bonus?.casinos?.name || '').toLowerCase().includes(searchTerm)
              )
            } catch (err) {
              console.warn('Error filtering bonus:', bonus?.id, err)
              return false
            }
          })
        }
      }

    // Bonus type filter with safety checks
    if (filters.bonusType && filters.bonusType !== "all") {
      filtered = filtered.filter(bonus => {
        try {
          return bonus?.bonus_type?.toLowerCase() === filters.bonusType
        } catch (err) {
          console.warn('Error filtering by bonus type:', bonus?.id, err)
          return false
        }
      })
    }

    // Casino filter with safety checks
    if (filters.casino && filters.casino !== "all") {
      filtered = filtered.filter(bonus => {
        try {
          return bonus?.casinos?.name?.toLowerCase() === filters.casino
        } catch (err) {
          console.warn('Error filtering by casino:', bonus?.id, err)
          return false
        }
      })
    }

    // Amount range filter with null safety and type conversion
    filtered = filtered.filter(bonus => {
      try {
        const amount = Number(bonus?.bonus_amount) || 0
        return amount >= (filters.minAmount || 0) && amount <= (filters.maxAmount || 10000)
      } catch (err) {
        console.warn('Error filtering by amount:', bonus?.id, err)
        return false
      }
    })

    // Wagering filter
    if (filters.wagering !== "all") {
      filtered = filtered.filter(bonus => {
        const wagering = Number(bonus.wagering_x) || 0
        switch (filters.wagering) {
          case "low": return wagering <= 25
          case "medium": return wagering > 25 && wagering <= 40
          case "high": return wagering > 40
          default: return true
        }
      })
    }

    // Feature filters
    if (filters.features.noDeposit) {
      filtered = filtered.filter(bonus => bonus.bonus_type?.toLowerCase().includes("no deposit"))
    }
    if (filters.features.freeSpins) {
      filtered = filtered.filter(bonus => 
        bonus.bonus_type?.toLowerCase().includes("free spins") || 
        (bonus as any).free_spins > 0
      )
    }
    if (filters.features.exclusive) {
      filtered = filtered.filter(bonus => bonus.is_exclusive)
    }

    // Sort bonuses with type safety and validation
    if (Array.isArray(filtered) && filtered.length > 0) {
      filtered.sort((a, b) => {
        try {
      switch (filters.sortBy) {
        case "amount_high":
          return (Number(b.bonus_amount) || 0) - (Number(a.bonus_amount) || 0)
        case "amount_low":
          return (Number(a.bonus_amount) || 0) - (Number(b.bonus_amount) || 0)
        case "wagering_low":
          return (Number(a.wagering_x) || 0) - (Number(b.wagering_x) || 0)
        case "expiring":
          if (!a.expiry_date || !b.expiry_date) return 0
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        } catch (sortError) {
          console.warn('Error sorting bonuses:', sortError)
          return 0
        }
      })
    }

    onFilterChange(filtered)
    } catch (error) {
      console.error('Filter error:', error)
      onFilterChange(bonuses) // Fallback to original data
    }
  }, [filters, bonuses, onFilterChange])

  // Handle search input changes with debouncing
  useEffect(() => {
    debouncedSearch(searchInput)
  }, [searchInput, debouncedSearch])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  const updateFeatureFilter = (feature: keyof FilterState['features'], value: boolean) => {
    setFilters(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value }
    }))
  }

  const resetFilters = () => {
    setSearchInput("")
    setFilters({
      search: "",
      bonusType: "all",
      casino: "all",
      minAmount: 0,
      maxAmount: 10000,
      wagering: "all",
      features: {
        noDeposit: false,
        freeSpins: false,
        exclusive: false
      },
      sortBy: "newest"
    })
  }

  const hasActiveFilters = 
    searchInput !== "" ||
    filters.bonusType !== "all" ||
    filters.casino !== "all" ||
    filters.minAmount > 0 ||
    filters.maxAmount < 10000 ||
    filters.wagering !== "all" ||
    Object.values(filters.features).some(Boolean) ||
    filters.sortBy !== "newest"

  return (
    <GlassCard className={`mb-6 ${className}`}>
      <div className="p-4 sm:p-6">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#00ff88]" />
            <span className="text-white font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="bg-[#00ff88] text-black text-xs px-2 py-1 rounded-full font-semibold">
                Active
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-[#00ff88] hover:bg-white/10"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {isExpanded ? "Hide" : "Show"}
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Filter Content */}
        <div className={`space-y-4 ${isExpanded ? "block" : "hidden lg:block"}`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search bonuses, casinos..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Bonus Type */}
            <Select value={filters.bonusType} onValueChange={(value) => updateFilter("bonusType", value)}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-[#00ff88]">
                <SelectValue placeholder="Bonus Type" />
              </SelectTrigger>
              <SelectContent>
                {BONUS_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Casino */}
            <Select value={filters.casino} onValueChange={(value) => updateFilter("casino", value)}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-[#00ff88]">
                <SelectValue placeholder="Casino" />
              </SelectTrigger>
              <SelectContent>
                {casinoOptions.map(casino => (
                  <SelectItem key={casino.value} value={casino.value}>
                    {casino.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Wagering */}
            <Select value={filters.wagering} onValueChange={(value) => updateFilter("wagering", value)}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-[#00ff88]">
                <SelectValue placeholder="Wagering" />
              </SelectTrigger>
              <SelectContent>
                {WAGERING_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-[#00ff88]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Amount Range */}
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ""}
                  onChange={(e) => updateFilter("minAmount", parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-[#00ff88]"
                />
                <span className="text-white/60">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount === 10000 ? "" : filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", parseInt(e.target.value) || 10000)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-[#00ff88]"
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.features.noDeposit}
                  onChange={(e) => updateFeatureFilter("noDeposit", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00ff88] focus:ring-[#00ff88]/20"
                />
                <span className="text-white/90 text-sm">No Deposit Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.features.freeSpins}
                  onChange={(e) => updateFeatureFilter("freeSpins", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00ff88] focus:ring-[#00ff88]/20"
                />
                <span className="text-white/90 text-sm">Free Spins Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.features.exclusive}
                  onChange={(e) => updateFeatureFilter("exclusive", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00ff88] focus:ring-[#00ff88]/20"
                />
                <span className="text-white/90 text-sm">Exclusive Only</span>
              </label>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-white/70 hover:text-white hover:bg-white/10 ml-auto"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}