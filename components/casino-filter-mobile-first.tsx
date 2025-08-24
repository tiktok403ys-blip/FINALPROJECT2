"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import { Filter, X } from 'lucide-react'

// Touch target constants
const TOUCH_TARGET = "min-h-[44px] min-w-[44px]"

interface CasinoFilterMobileFirstProps {
  currentFilter: 'all' | 'high-rated' | 'new' | 'live'
}

export function CasinoFilterMobileFirst({ currentFilter }: CasinoFilterMobileFirstProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const filters = [
    { key: 'all', label: 'All Casinos', href: '/casinos' },
    { key: 'high-rated', label: 'High Rated', href: '/casinos?filter=high-rated' },
    { key: 'new', label: 'New Casinos', href: '/casinos?filter=new' },
    { key: 'live', label: 'Live Casino', href: '/casinos?filter=live' },
  ]

  const currentFilterData = filters.find(f => f.key === currentFilter)

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6">
        <GlassCard className="p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`w-full ${TOUCH_TARGET} flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200`}
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[#00ff88]" />
              <div className="text-left">
                <div className="text-white font-semibold">Filter Casinos</div>
                <div className="text-gray-400 text-sm">
                  {currentFilterData?.label || 'All Casinos'}
                </div>
              </div>
            </div>
            <div className={`transform transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>

          {isMobileMenuOpen && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="ghost"
                  className={`w-full justify-start text-left ${TOUCH_TARGET} px-4 py-3 ${
                    currentFilter === filter.key
                      ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  asChild
                >
                  <Link
                    href={filter.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {filter.label}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Desktop Filter Section */}
      <div className="hidden lg:block mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-[#00ff88]" />
              <span className="font-semibold">Filter Casinos:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="outline"
                  size="sm"
                  className={`px-6 py-2 ${TOUCH_TARGET} ${
                    currentFilter === filter.key
                      ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20'
                      : 'border-gray-600 text-gray-400 bg-transparent hover:bg-white/5 hover:border-gray-500'
                  }`}
                  asChild
                >
                  <Link href={filter.href}>
                    {filter.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  )
}
