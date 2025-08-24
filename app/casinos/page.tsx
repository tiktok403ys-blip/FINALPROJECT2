import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Star,
  MapPin,
  Filter,
  Search,
  Shield,
  Users,
  Database,
  Scale,
  Globe,
  UserCheck,
  TrendingUp,
  FileText,
  Building,
  MessageSquare,
  AlertTriangle,
  Gift,
  Play,
  RotateCcw,
  MessageCircle,
  Phone,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import RealtimeCasinosRefresher from "@/components/realtime-casinos-refresher"
import type { Casino } from "@/lib/types"

// Advanced React Ecosystem imports
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { CasinoErrorBoundary } from '@/components/error-boundary'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { StreamingCasinoGrid } from '@/components/streaming/casino-stream'
import { CasinoFilterMobileFirst } from '@/components/casino-filter-mobile-first'
import { QueryProvider } from '@/components/providers/query-provider'
import { getCasinosServer } from '@/lib/server/casino-server'

// Server Actions
import { searchCasinos } from '@/app/actions/casino-actions'

// Loading components
function CasinoCardSkeleton() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="h-32 sm:h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-20 h-16 sm:w-24 sm:h-20 bg-gray-700 rounded-lg animate-pulse" />
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-10 bg-gray-700 rounded w-full animate-pulse" />
        </div>
      </div>
    </GlassCard>
  )
}

function FilterSkeleton() {
  return (
    <GlassCard className="p-4">
      <div className="h-5 bg-gray-700 rounded mb-3 w-24 animate-pulse" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-gray-700 rounded px-4 w-20 animate-pulse" />
        ))}
      </div>
    </GlassCard>
  )
}

export const metadata = {
  title: "Best Online Casinos - GuruSingapore",
  description:
    "Discover the best online casinos with verified reviews, ratings, and exclusive bonuses. Find your perfect casino today.",
}

// Revalidate every 5 minutes for testing - reduces delay for established_year updates
export const revalidate = 300

// Enhanced casinos page with React Server Components
export default async function CasinosPage({ searchParams }: { searchParams?: Promise<{ filter?: string; page?: string }> }) {
  // Server-side data fetching with enhanced error handling
  const resolvedSearchParams = await searchParams
  const filter = resolvedSearchParams?.filter || 'all'
  const page = parseInt(resolvedSearchParams?.page || '1')

  const casinoData = await getCasinosServer(filter, new URLSearchParams({
    filter,
    page: page.toString(),
    limit: '20'
  }))

  if (casinoData.error) {
    console.error('Server error fetching casinos:', casinoData.error)
    // Return error page
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Casinos</h1>
          <p className="text-gray-400">Please try again later.</p>
        </div>
      </div>
    )
  }

  const { casinos = [], total, currentPage, totalPages = 1 } = casinoData

  // Debug logging
  console.log(`[SERVER] Loaded ${casinos.length} casinos for filter: ${filter}, page: ${currentPage}`)



  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

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

  // Clean implementation - focus on features and payment methods only
  // Language info is already displayed in the dedicated section with icons
  const getDynamicFeatures = (casino: Casino) => {
    console.log(`[DEBUG] Processing casino: ${casino.name} (ID: ${casino.id})`)
    console.log(`[DEBUG] Casino data:`, {
      established_year: casino.established_year,
      features: casino.features,
      payment_methods: casino.payment_methods,
      license: casino.license,
      location: casino.location
    })
    const features = []

    // 1. FEATURES - Show ALL available features (no arbitrary limit)
    if (casino.features && casino.features.length > 0) {
      casino.features.forEach((feature) => {
        features.push({
          text: feature.trim(),
          type: 'feature',
          priority: 1,
          color: 'text-green-400',      // ✅ CONSISTENT: Always bright green
          bgColor: 'bg-green-400'       // ✅ CONSISTENT: Always bright green
        })
      })
    } else {
      features.push({
        text: "Premium casino gaming features",
        type: 'feature',
        priority: 1,
        color: 'text-green-400',
        bgColor: 'bg-green-400'
      })
    }

    // 2. PAYMENT METHODS - Show ALL available methods (no arbitrary limit)
    if (casino.payment_methods && casino.payment_methods.length > 0) {
      casino.payment_methods.forEach((method) => {
        features.push({
          text: `${method.trim()} payments accepted`,
          type: 'payment',
          priority: 2,
          color: 'text-purple-400',     // ✅ CONSISTENT: Always purple
          bgColor: 'bg-purple-400'      // ✅ CONSISTENT: Always purple
        })
      })
    } else {
      features.push({
        text: "Multiple secure payment options",
        type: 'payment',
        priority: 2,
        color: 'text-purple-400',
        bgColor: 'bg-purple-400'
      })
    }

    // 3. LICENSE INFO (If available)
    if (casino.license) {
      features.push({
        text: "Fully licensed and regulated",
        type: 'license',
        priority: 3,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400'
      })
    }

    // 4. ESTABLISHED YEAR (Enhanced validation and debugging)
    const establishedYear = casino.established_year
    if (establishedYear && !isNaN(Number(establishedYear)) && Number(establishedYear) > 1900) {
      console.log(`[DEBUG] Adding established year feature: ${establishedYear} for ${casino.name}`)
      features.push({
        text: `Established ${establishedYear}`,
        type: 'credibility',
        priority: 4,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400'
      })
    } else if (establishedYear) {
      console.log(`[DEBUG] Invalid established year: ${establishedYear} (type: ${typeof establishedYear}) for ${casino.name}`)
    } else {
      console.log(`[DEBUG] No established year for casino: ${casino.name}`)
    }

    // 5. LOCATION INFO (If available)
    if (casino.location) {
      features.push({
        text: `International casino - ${casino.location}`,
        type: 'location',
        priority: 5,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400'
      })
    }

    // Sort by priority to ensure most important info appears first
    const sortedFeatures = features.sort((a, b) => a.priority - b.priority)
    console.log(`[DEBUG] Generated ${sortedFeatures.length} features for ${casino.name}`)
    return sortedFeatures
  }

  // Color mapping is now handled directly in getDynamicFeatures for consistency
  // No complex color schemes needed - user wants consistent colors per type

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/#organization`,
        "name": "GuruSingapore",
        "url": process.env.NEXT_PUBLIC_SITE_URL,
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        "description": "Expert casino reviews and gambling guides for Singapore players",
        "sameAs": [
          "https://twitter.com/gurusingapore",
          "https://facebook.com/gurusingapore"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": process.env.NEXT_PUBLIC_SITE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Best Online Casinos",
            "item": `${process.env.NEXT_PUBLIC_SITE_URL}/casinos`
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Best Online Casinos",
        "description": "Top-rated online casinos reviewed by experts",
        "numberOfItems": casinos?.length || 0,
        "itemListElement": casinos?.map((casino: Casino, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Organization",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/casinos/${casino.id}`,
            "name": casino.name,
            "url": casino.website_url,
            "description": casino.description,
            "aggregateRating": casino.rating ? {
              "@type": "AggregateRating",
              "ratingValue": casino.rating,
              "bestRating": 10,
              "worstRating": 1,
              "ratingCount": casino.player_rating_count || 1
            } : undefined
          }
        })) || []
      }
    ]
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-black">
        {/* Realtime refresh when casinos change */}
        <RealtimeCasinosRefresher />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <DynamicPageHero
          pageName="casinos"
          sectionType="hero"
          fallbackTitle="Best Online Casinos - GuruSingapore"
          fallbackDescription="Discover the best online casinos with verified reviews, ratings, and exclusive bonuses."
          breadcrumbs={[{ label: "Best online casinos" }]}
          author={{ name: "GuruSingapore Team" }}
          date="10 Dec 2024"
        />

        <div className="container mx-auto px-4 py-16">
          {/* Performance Monitor - Development only */}
          <PerformanceMonitor />

          {/* Error Boundary untuk keseluruhan page */}
          <CasinoErrorBoundary>
            {/* Filter Section - Optimized with streaming */}
            <Suspense fallback={<FilterSkeleton />}>
              <CasinoFilterMobileFirst currentFilter={filter as 'all' | 'high-rated' | 'new' | 'live'} />
            </Suspense>

            {/* Streaming Casino Grid - Advanced React Server Components */}
            <StreamingCasinoGrid
              initialCasinos={casinos}
              enableStreaming={true}
              enableProgressiveLoading={true}
            />

            {/* Pagination Info */}
            {totalPages > 1 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages} • {total} total casinos
                </p>
              </div>
            )}

          {/* Error Boundary Close */}
        </CasinoErrorBoundary>

        {!casinos?.length && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Casinos Found</h3>
            <p className="text-gray-400 text-lg">We&apos;re working on adding more casinos to our database.</p>
          </div>
        )}

        {/* How GuruSingapore Helps Section - Optimized for mobile */}
        <div className="mt-20 mb-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-4 leading-tight">
              How GuruSingapore can help you make the right choice
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-[#00ff88] mx-auto mb-12 sm:mb-16"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <Database className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Up-to-date data on all real money online casinos</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  We review over 7,000 real money casino sites, ensuring one of the widest and most up to date
                  selections on the market.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <Users className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Independent casino review team</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  A dedicated team of nearly 20 reviewers applies a consistent, data-driven methodology.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <TrendingUp className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Methodical and objective reviews</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  Each casino is scored using a Safety Index based on over 20 factors.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <UserCheck className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Casino testers all around the world</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  Our global reach includes local experts from the most popular gambling regions.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <Scale className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Ensuring fairness and player safety</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  We resolved over 14K complaints in favor of the player.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="text-center space-y-4 group">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <Globe className="w-8 sm:w-10 h-8 sm:h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Enhanced by millions of casino players</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  600,000+ registered forum users and millions of site visitors worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Method Section - Optimized */}
        <div className="mt-20 mb-16">
          <div className="max-w-4xl mx-auto px-4">
            <GlassCard className="p-6 sm:p-8 lg:p-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 text-center leading-tight">
                Our method, your safety: how we rate casinos
              </h2>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 text-center">
                The team at GuruSingapore methodically reviews each casino site, focusing on fairness and safety through our Safety Index.
              </p>

              <div className="space-y-8 sm:space-y-10">
                {/* Fairness of terms and conditions */}
                <div className="border-l-4 border-[#00ff88] pl-4 sm:pl-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-[#00ff88] flex-shrink-0 mt-1" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Fairness of terms and conditions</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    Over 600 casinos have amended their T&Cs based on our recommendations.
                  </p>
                </div>

                {/* Casino size */}
                <div className="border-l-4 border-[#00ff88] pl-4 sm:pl-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Building className="w-5 sm:w-6 h-5 sm:h-6 text-[#00ff88] flex-shrink-0 mt-1" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Casino size</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    Larger casinos are generally safer due to their resources and reputation.
                  </p>
                </div>

                {/* Player complaints */}
                <div className="border-l-4 border-[#00ff88] pl-4 sm:pl-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6 text-[#00ff88] flex-shrink-0 mt-1" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Player complaints</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    Our Complaint Resolution Center has handled over 53,000 complaints.
                  </p>
                </div>

                {/* Casino blacklists */}
                <div className="border-l-4 border-red-500 pl-4 sm:pl-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-red-500 flex-shrink-0 mt-1" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Casino blacklists</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    Blacklisted casinos receive lower Safety Index scores.
                  </p>
                </div>
              </div>

              <div className="mt-12 p-4 sm:p-6 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-[#00ff88] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#00ff88] font-bold text-base sm:text-lg mb-2">Our Commitment to Player Safety</h4>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      Every casino undergoes rigorous evaluation using our Safety Index.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Safety Notice - Optimized */}
        <div className="mt-16 mb-8">
          <GlassCard className="p-6 sm:p-8 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">How We Rate Casinos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2 text-sm sm:text-base">Security & Licensing</h4>
                <p className="text-gray-400 text-sm">We verify licenses and regulatory compliance.</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2 text-sm sm:text-base">Player Experience</h4>
                <p className="text-gray-400 text-sm">Real player reviews matter.</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2 text-sm sm:text-base">Game Quality</h4>
                <p className="text-gray-400 text-sm">We evaluate game variety and fairness.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
    </QueryProvider>
  )
}
