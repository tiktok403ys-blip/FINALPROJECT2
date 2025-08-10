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
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Ultimate <span className="text-[#00ff88]">Casino</span> Guide
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of
          online gaming.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 text-lg px-8 py-6" asChild>
            <Link href="/casinos">Explore Casinos</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black text-lg px-8 py-6 bg-transparent"
            asChild
          >
            <Link href="/bonuses">Best Bonuses</Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[#00ff88] rounded-full flex justify-center">
          <div className="w-1 h-3 bg-[#00ff88] rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
