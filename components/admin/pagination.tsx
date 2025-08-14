"use client"

import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  setPage: (page: number) => void
  disablePrev?: boolean
  disableNext?: boolean
}

export function PaginationControls({ page, setPage, disablePrev, disableNext }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between mt-8">
      <div className="text-gray-400 text-sm">Page {page}</div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="bg-transparent text-white border-white/20"
          disabled={disablePrev}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          className="bg-transparent text-white border-white/20"
          disabled={disableNext}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}


