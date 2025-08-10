"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CasinoScreenshot {
  id: string
  image_url: string
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_featured: boolean
}

interface CasinoScreenshotsProps {
  screenshots: CasinoScreenshot[]
}

export function CasinoScreenshots({ screenshots }: CasinoScreenshotsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "lobby":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "games":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "mobile":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "promotions":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case "lobby":
        return "Lobby"
      case "games":
        return "Games"
      case "mobile":
        return "Mobile"
      case "promotions":
        return "Promotions"
      default:
        return "General"
    }
  }

  if (!screenshots.length) {
    return (
      <div className="text-center py-8">
        <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Belum ada screenshot tersedia</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-5 h-5 md:w-6 md:h-6 text-[#00ff88]" />
          <h3 className="text-lg md:text-xl font-bold text-white">Casino Screenshots</h3>
        </div>

        {/* Navigation Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 md:w-10 md:h-10 border-white/10 bg-white/5 hover:bg-white/10"
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 md:w-10 md:h-10 border-white/10 bg-white/5 hover:bg-white/10"
            onClick={scrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {screenshots.map((screenshot) => (
          <div
            key={screenshot.id}
            className="flex-shrink-0 w-64 md:w-80 group cursor-pointer"
            onClick={() => setSelectedImage(screenshot.image_url)}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-[#00ff88]/30 transition-all duration-300">
              <Image
                src={screenshot.image_url || "/placeholder.svg"}
                alt={screenshot.title || "Casino screenshot"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Category Badge */}
              {screenshot.category && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(screenshot.category)}`}>
                    {getCategoryLabel(screenshot.category)}
                  </Badge>
                </div>
              )}

              {/* Featured Badge */}
              {screenshot.is_featured && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#00ff88] text-black text-xs">Featured</Badge>
                </div>
              )}

              {/* View Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Eye className="w-6 h-6 text-[#00ff88]" />
                </div>
              </div>
            </div>

            {/* Screenshot Info */}
            {screenshot.title && (
              <div className="mt-3 px-1">
                <h4 className="text-sm font-medium text-white truncate">{screenshot.title}</h4>
                {screenshot.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{screenshot.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Screenshot preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
