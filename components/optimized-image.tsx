"use client"

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { trackEvent } from '@/lib/analytics'

interface OptimizedImageProps extends Omit<React.ComponentProps<typeof Image>, 'src'> {
  src: string
  alt: string
  className?: string
  enableCDN?: boolean
  trackPerformance?: boolean
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  className,
  enableCDN = true,
  trackPerformance = false,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  quality = 85,
  sizes,
  onLoad,
  onError,
  fallbackSrc,
  ...props
}: OptimizedImageProps) {
  const { isMobile, isTablet } = useMobileFirst()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [imageLoadTime, setImageLoadTime] = useState(0)
  const loadStartTime = useRef<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate optimized image URL
  const getOptimizedSrc = (originalSrc: string): string => {
    if (!enableCDN) return originalSrc

    // For demo purposes, we'll use a simple optimization
    // In production, you'd use a CDN like Cloudflare, ImageKit, or similar
    const url = new URL(originalSrc, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

    // Add quality parameter for WebP/AVIF optimization
    url.searchParams.set('q', quality.toString())

    // Add format preference
    url.searchParams.set('f', 'webp,avif')

    // Add mobile optimization
    if (isMobile) {
      url.searchParams.set('mobile', '1')
      url.searchParams.set('w', '640') // Mobile width
    } else if (isTablet) {
      url.searchParams.set('w', '1024') // Tablet width
    }

    return url.toString()
  }

  // Generate responsive sizes based on device
  const getResponsiveSizes = (): string => {
    if (sizes) return sizes

    if (isMobile) {
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    } else if (isTablet) {
      return "(max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 25vw"
    }

    return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 25vw"
  }

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)

    if (loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current
      setImageLoadTime(loadTime)

      if (trackPerformance) {
        trackEvent({
          action: 'image_loaded',
          category: 'Performance',
          label: currentSrc,
          value: Math.round(loadTime),
          customParameters: {
            load_time: Math.round(loadTime),
            image_size: imgRef.current?.naturalWidth + 'x' + imgRef.current?.naturalHeight,
            device_type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            cdn_enabled: enableCDN
          }
        })
      }
    }

    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)

    if (trackPerformance) {
      trackEvent({
        action: 'image_load_error',
        category: 'Error',
        label: currentSrc,
        customParameters: {
          error_type: 'image_load_failed',
          fallback_available: !!fallbackSrc,
            device_type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
          }
        })
      }

    // Try fallback image if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
      loadStartTime.current = performance.now()
    } else {
      onError?.()
    }
  }

  // Set load start time when src changes
  useEffect(() => {
    if (currentSrc && !hasError) {
      loadStartTime.current = performance.now()
    }
  }, [currentSrc, hasError])

  // Lazy loading for mobile optimization
  const [isInView, setIsInView] = useState(!isMobile) // Always load on desktop

  useEffect(() => {
    if (!isMobile || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [isMobile])

  const optimizedSrc = getOptimizedSrc(currentSrc)
  const responsiveSizes = getResponsiveSizes()

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse rounded-lg" />
      )}

      {/* Error placeholder */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 mx-auto mb-2 opacity-50">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      {isInView && (
        <Image
          src={optimizedSrc}
          alt={alt}
          className={cn(
            "transition-all duration-300",
            isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
            hasError && 'opacity-0'
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          quality={quality}
          sizes={responsiveSizes}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Performance debug overlay (development only) */}
      {trackPerformance && imageLoadTime > 0 && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
          {Math.round(imageLoadTime)}ms
        </div>
      )}
    </div>
  )
}

// Preload critical images for mobile
export function PreloadCriticalImages({ images }: { images: string[] }) {
  const { isMobile } = useMobileFirst()

  useEffect(() => {
    if (!isMobile) return

    // Preload only critical images on mobile
    const criticalImages = images.slice(0, 3)

    criticalImages.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })

    return () => {
      // Cleanup preloaded images
      document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => {
        document.head.removeChild(link)
      })
    }
  }, [images, isMobile])

  return null
}

// Image carousel optimized for mobile
export function MobileOptimizedImageCarousel({
  images,
  className
}: {
  images: { src: string; alt: string }[]
  className?: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((image, index) => (
          <div key={index} className="w-full flex-shrink-0">
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className="w-full h-48 sm:h-64 object-contain bg-black/20 rounded-lg"
              enableCDN={true}
              trackPerformance={false}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-[#00ff88]" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}

      {/* Swipe indicators */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        Swipe to navigate
      </div>
    </div>
  )
}