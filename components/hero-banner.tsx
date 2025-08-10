"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroBanner() {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image/Video Placeholder */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"
        style={{
          backgroundImage: `url('/placeholder-714xv.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
          Ultimate <span className="text-[#00ff88]">Casino</span> Guide
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of
          online gaming.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <Button
            size="lg"
            className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto"
            asChild
          >
            <Link href="/casinos">Explore Casinos</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-transparent w-full sm:w-auto"
            asChild
          >
            <Link href="/bonuses">Best Bonuses</Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="relative group cursor-pointer">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-[#00ff88]/30 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />

          {/* Main Scroll Indicator */}
          <div className="relative w-5 h-8 md:w-6 md:h-10 border-2 border-[#00ff88] rounded-full flex justify-center bg-black/20 backdrop-blur-sm group-hover:border-[#00ff88]/80 transition-all duration-300">
            <div className="w-0.5 md:w-1 h-2 md:h-3 bg-[#00ff88] rounded-full mt-1.5 md:mt-2 animate-pulse group-hover:bg-[#00ff88]/80 transition-all duration-300" />
          </div>

          {/* Text Label for Desktop */}
          <div className="hidden md:block absolute top-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Scroll to explore
          </div>
        </div>
      </div>
    </div>
  )
}
