'use client'

import { Grid as GridIcon, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GridToggleButtonProps {
  isGridView: boolean
  onToggle: (isGrid: boolean) => void
  className?: string
}

export function GridToggleButton({ 
  isGridView, 
  onToggle, 
  className 
}: GridToggleButtonProps) {
  return (
    <div className={cn("hidden md:flex items-center", className)}>
      <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={cn(
            "px-3 py-2 text-sm flex items-center gap-2",
            !isGridView ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
          aria-pressed={!isGridView}
        >
          <ListIcon className="w-4 h-4" />
          List
        </button>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={cn(
            "px-3 py-2 text-sm flex items-center gap-2 border-l border-white/10",
            isGridView ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
          aria-pressed={isGridView}
        >
          <GridIcon className="w-4 h-4" />
          Grid
        </button>
      </div>
    </div>
  )
}