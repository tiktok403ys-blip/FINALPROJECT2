"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CasinoBanner {
  id: string
  image_url: string
  title: string
  subtitle: string | null
  is_primary: boolean
  display_order: number
}

interface CasinoBannerProps {
  casinoId: string
  banners: CasinoBanner[]
}

export function CasinoBanner({ casinoId, banners }: CasinoBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, banners.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  if (!banners.length) {
    return (
      <div className="relative w-full h-64 md:h-96 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Casino Banner</h2>
            <p className="text-gray-400">No banner images available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden group">
      {/* Banner Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={banner.image_url || "/placeholder.svg"}
              alt={banner.title}
              fill
              className="object-contain"
              priority={index === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/30" />

            {/* Banner Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-2xl px-4">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">{banner.title}</h2>
                {banner.subtitle && <p className="text-sm md:text-lg text-gray-200 opacity-90">{banner.subtitle}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={nextSlide}
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-[#00ff88] scale-125" : "bg-gray-600 hover:bg-gray-500"
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
