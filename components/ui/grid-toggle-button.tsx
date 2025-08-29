'use client'

import { Grid, List } from 'lucide-react'
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
    <div className={cn(
      "hidden md:flex items-center gap-3",
      className
    )}>
      <span className="text-sm text-gray-400 font-medium tracking-wide">
        View:
      </span>
      <div className="flex items-center bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(false)}
          className={cn(
            "h-8 px-4 transition-all duration-300 ease-out rounded-md border-0",
            "hover:shadow-md active:shadow-sm",
            !isGridView 
              ? "bg-gray-800/80 text-white shadow-lg shadow-gray-900/20 scale-100" 
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 scale-95"
          )}
        >
          <List className="h-4 w-4 mr-2 transition-transform duration-200 ease-out" />
          List
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(true)}
          className={cn(
            "h-8 px-4 transition-all duration-300 ease-out rounded-md border-0",
            "hover:shadow-md active:shadow-sm",
            isGridView 
              ? "bg-gray-800/80 text-white shadow-lg shadow-gray-900/20 scale-100" 
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 scale-95"
          )}
        >
          <Grid className="h-4 w-4 mr-2 transition-transform duration-200 ease-out" />
          Grid
        </Button>
      </div>
    </div>
  )
}