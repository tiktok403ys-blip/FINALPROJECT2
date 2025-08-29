'use client'

import { useState } from 'react'
import { UnifiedCasinoRealtime } from '@/components/realtime/unified-casino-realtime'
import { GridToggleButton } from '@/components/ui/grid-toggle-button'
import { Casino } from '@/lib/types'

interface CasinoGridWrapperProps {
  initialCasinos: Casino[]
  enableStreaming?: boolean
  enableProgressiveLoading?: boolean
  showConnectionStatus?: boolean
  filterOptions?: {
    category?: string
    minRating?: number
    sortBy?: 'rating' | 'name' | 'newest'
  }
}

export function CasinoGridWrapper({
  initialCasinos,
  enableStreaming = true,
  enableProgressiveLoading = true,
  showConnectionStatus = true,
  filterOptions
}: CasinoGridWrapperProps) {
  const [isGridView, setIsGridView] = useState(false)

  return (
    <>
      {/* Grid Toggle Button - Desktop Only */}
      <div className="mb-6">
        <GridToggleButton 
          isGridView={isGridView} 
          onToggle={setIsGridView} 
        />
      </div>

      {/* Enhanced Unified Casino Realtime Grid */}
      <UnifiedCasinoRealtime
        initialCasinos={initialCasinos}
        enableStreaming={enableStreaming}
        enableProgressiveLoading={enableProgressiveLoading}
        showConnectionStatus={false}
        isGridView={isGridView}
        filterOptions={filterOptions}
      />
    </>
  )
}