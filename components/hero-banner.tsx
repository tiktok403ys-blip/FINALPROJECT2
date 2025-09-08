"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"

// Simple Typewriter Effect Component
const TypewriterText = ({ text, speed = 100 }: { text: string; speed?: number }) => {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse text-[#00ff88] ml-1">|</span>}
    </span>
  )
}

interface HeroProps {
  imageUrl?: string | null
  title?: string | null
  subtitle?: string | null
  ctaPrimaryText?: string | null
  ctaPrimaryLink?: string | null
  ctaSecondaryText?: string | null
  ctaSecondaryLink?: string | null
}

export function HeroBanner({
  imageUrl,
  title = "Ultimate Casino Guide",
  subtitle = "Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of online gaming.",
  ctaPrimaryText = "Explore Casinos",
  ctaPrimaryLink = "/casinos",
  ctaSecondaryText = "Best Bonuses",
  ctaSecondaryLink = "/bonuses",
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bgRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [parallaxEnabled, setParallaxEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isCoarse = window.matchMedia('(pointer: coarse)')
    const isWide = () => window.innerWidth >= 1024 // desktop only

    const shouldEnable = !reduceMotion.matches && !isCoarse.matches && isWide()
    setParallaxEnabled(shouldEnable)

    const handleChange = () => setParallaxEnabled(!reduceMotion.matches && !isCoarse.matches && isWide())
    reduceMotion.addEventListener?.('change', handleChange)
    isCoarse.addEventListener?.('change', handleChange)
    window.addEventListener('resize', handleChange)

    return () => {
      reduceMotion.removeEventListener?.('change', handleChange)
      isCoarse.removeEventListener?.('change', handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!parallaxEnabled) {
      if (bgRef.current) bgRef.current.style.transform = ''
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const update = () => {
      if (!containerRef.current || !bgRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      // Only update while visible to save work
      if (rect.bottom < 0 || rect.top > vh) return

      const factor = 0.15 // subtle parallax speed
      const maxShift = 60 // clamp (px)
      const shift = Math.max(Math.min(-rect.top * factor, maxShift), -maxShift)
      bgRef.current.style.transform = `translate3d(0, ${shift}px, 0)`
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // initial position
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [parallaxEnabled])
  // Custom smooth scroll function with enhanced smoothness
  const smoothScrollTo = (element: Element, duration: number = 1500) => {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    // Easing function for smooth animation (easeInOutCubic)
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * easedProgress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  // Function to handle smooth scroll to Top Rated Casinos section
  const handleScrollDown = () => {
    // Find the "Top Rated Casinos" section by searching for the heading text
    const headings = document.querySelectorAll('h2');
    let topRatedSection = null;
    
    for (const heading of headings) {
      if (heading.textContent?.includes('Top Rated Casinos')) {
        topRatedSection = heading.closest('section');
        break;
      }
    }
    
    // Fallback selectors if heading search fails
    if (!topRatedSection) {
      topRatedSection = 
        document.querySelector('.container section:first-child') ||
        document.querySelector('.container > section') ||
        document.querySelector('section') ||
        document.querySelector('.container');
    }
    
    if (topRatedSection) {
      // Use custom smooth scroll for better control
      smoothScrollTo(topRatedSection, 1500);
    }
  };
  return (
    <div ref={containerRef} className="relative h-[60vh] md:h-[70vh] lg:h-screen flex items-center justify-center overflow-hidden">
      {/* Optimized Background Image with Next.js Image */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Image
          src={imageUrl || "/placeholder-714xv.png"}
          alt="Hero background"
          fill
          priority={false}
          className="object-cover object-center"
          sizes="100vw"
          placeholder="empty"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder-714xv.png"
          }}
        />
        {/* Optimized overlay - only dark overlay, remove complex gradients */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-4 sm:py-6 md:py-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
          {title?.split("Casino").length === 2 ? (
            <>
              {title.split("Casino")[0]}
              <span className="text-[#00ff88] font-semibold">Casino</span>
              {title.split("Casino")[1]}
            </>
          ) : (
            title
          )}
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
          <TypewriterText
            text={subtitle || "Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of online gaming."}
            speed={80}
          />
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 md:mb-12">
          <Button
            size="lg"
            className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-300 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto"
            asChild
          >
            <Link href={ctaPrimaryLink || "/"}>{ctaPrimaryText || "Explore"}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-semibold px-8 py-3 rounded-lg transition-all duration-300 backdrop-blur-sm text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-transparent w-full sm:w-auto"
            asChild
          >
            <Link href={ctaSecondaryLink || "/"}>{ctaSecondaryText || "Learn more"}</Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator - Optimized single click handler */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div
          className="flex flex-col items-center cursor-pointer animate-float"
          onClick={handleScrollDown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleScrollDown()
            }
          }}
          aria-label="Scroll down to content"
        >
          <ChevronDown
            className="w-6 h-6 text-white/80 hover:text-white transition-all duration-500"
            aria-hidden="true"
          />
          <span
            className="text-xs text-white/60 mt-1 hover:text-white/80 transition-all duration-300 active:scale-95"
            aria-hidden="true"
          >
            Scroll Down
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
