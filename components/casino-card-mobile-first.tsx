"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import {
  Star,
  MapPin,
  Shield,
  Play,
  RotateCcw,
  Globe,
  MessageCircle,
  Phone,
} from 'lucide-react'
import type { Casino } from '@/lib/types'

// Touch target constants
const TOUCH_TARGET = "min-h-[44px] min-w-[44px]"

interface CasinoCardMobileFirstProps {
  casino: Casino
  rank: number
}

export function CasinoCardMobileFirst({ casino, rank }: CasinoCardMobileFirstProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "text-green-400"
    if (rating >= 7) return "text-yellow-400"
    if (rating >= 5) return "text-orange-400"
    return "text-red-400"
  }

  const getRatingBadge = (rating: number) => {
    if (rating >= 9) return { text: "Excellent", color: "bg-green-500/20 text-green-400 border-green-500/30" }
    if (rating >= 7) return { text: "Good", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    if (rating >= 5) return { text: "Fair", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
    return { text: "Poor", color: "bg-red-500/20 text-red-400 border-red-500/30" }
  }

  const ratingBadge = getRatingBadge(casino.rating || 0)

  return (
    <GlassCard className="overflow-hidden group">
      {/* Mobile-First Layout */}
      <div className="flex flex-col">
        {/* Header Section - Always visible */}
        <div className="relative">
          {/* Ranking Badge */}
          <div className="absolute top-4 left-4 bg-[#00ff88] text-black text-sm font-bold px-3 py-1 rounded-full z-10 shadow-lg">
            #{rank}
          </div>

          {/* Logo Section */}
          <div
            className="h-32 sm:h-40 flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: casino.placeholder_bg_color || '#1f2937' }}
          >
            {casino.logo_url ? (
              <div className="relative w-20 h-16 sm:w-24 sm:h-20">
                <Image
                  src={casino.logo_url}
                  alt={`${casino.name} logo`}
                  fill
                  className="object-contain filter brightness-110"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>
            ) : (
              <div className="text-center p-3">
                <div className="text-white font-bold text-lg sm:text-xl mb-1">
                  {casino.name
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                    .slice(0, 3)}
                </div>
                <div className="text-[#00ff88] text-xs font-medium tracking-wider">
                  CASINO
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6">
          {/* Casino Header */}
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
              {casino.name}
            </h3>

            {/* Rating Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <Shield className={`w-5 h-5 mr-2 ${getRatingColor(casino.rating || 0)}`} />
                  <span className="text-white font-semibold text-sm sm:text-base">SAFETY INDEX:</span>
                  <span className={`font-bold ml-2 text-lg sm:text-xl ${getRatingColor(casino.rating || 0)}`}>
                    {casino.rating || "N/A"}
                  </span>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ratingBadge.color}`}>
                {ratingBadge.text.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bonus Info - Always visible */}
          {casino.bonus_info && (
            <div className="mb-4 p-4 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
              <div className="text-center">
                <div className="text-[#00ff88] font-bold text-sm sm:text-base mb-1 flex items-center justify-center gap-2">
                  BONUS: {casino.bonus_info}
                </div>
                <div className="text-xs text-gray-400">*T&Cs apply</div>
              </div>
            </div>
          )}

          {/* Expandable Features Section */}
          <div className="mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-full text-left ${TOUCH_TARGET} flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200`}
            >
              <span className="text-white font-medium text-sm sm:text-base">
                Features & Details
              </span>
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-300">
                {/* Features */}
                {casino.features && casino.features.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">Features</h4>
                    <div className="space-y-1">
                      {casino.features.slice(0, 4).map((feature, index) => (
                        <div key={`feature-${index}`} className="flex items-center text-green-400 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></div>
                          <span className="leading-relaxed">{feature.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                {casino.payment_methods && casino.payment_methods.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">Payment Methods</h4>
                    <div className="space-y-1">
                      {casino.payment_methods.slice(0, 3).map((method, index) => (
                        <div key={`payment-${index}`} className="flex items-center text-purple-400 text-sm">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                          <span className="leading-relaxed">{method.trim()} payments</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location & License */}
                <div className="space-y-2">
                  {casino.location && (
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>International casino - {casino.location}</span>
                    </div>
                  )}
                  {casino.license && (
                    <div className="flex items-center text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span>Licensed & Regulated Casino</span>
                    </div>
                  )}
                  {casino.established_year && (
                    <div className="flex items-center text-indigo-400 text-sm">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                      <span>Established {casino.established_year}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {casino.website_url && (
              <Button
                className={`w-full bg-[#00ff88] text-black hover:bg-[#00ff88]/80 font-bold text-sm sm:text-base py-3 ${TOUCH_TARGET}`}
                asChild
              >
                <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                  <Play className="w-4 h-4 mr-2" />
                  Visit Casino
                </Link>
              </Button>
            )}

            <Button
              variant="outline"
              className={`w-full border-purple-500 text-purple-400 bg-transparent hover:bg-purple-500/10 text-sm sm:text-base py-3 ${TOUCH_TARGET}`}
              asChild
            >
              <Link href={`/casinos/${casino.id}`}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Read Review
              </Link>
            </Button>
          </div>

          {/* Language Support - Collapsed on mobile */}
          {(casino.website_languages || casino.live_chat_languages || casino.customer_support_languages) && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-500 space-y-1">
                {casino.website_languages && casino.website_languages > 0 && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Website: {casino.website_languages} languages
                  </div>
                )}
                {casino.live_chat_languages && casino.live_chat_languages > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Live chat: {casino.live_chat_languages} languages
                  </div>
                )}
                {casino.customer_support_languages && casino.customer_support_languages > 0 && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    Customer support: {casino.customer_support_languages} languages
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

// Skeleton component for loading states
export function CasinoCardSkeleton() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="h-32 sm:h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-20 h-16 sm:w-24 sm:h-20 bg-gray-700 rounded-lg animate-pulse" />
      </div>

      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-700 rounded animate-pulse" />

        {/* Rating skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
          <div className="w-12 h-4 bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
        </div>

        {/* Bonus skeleton */}
        <div className="h-5 bg-gray-700 rounded animate-pulse w-2/3" />

        {/* Button skeleton */}
        <div className="h-10 bg-gray-700 rounded-lg animate-pulse" />
      </div>
    </GlassCard>
  )
}
