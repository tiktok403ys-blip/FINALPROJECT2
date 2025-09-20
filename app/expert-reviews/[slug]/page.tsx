import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Star,
  MessageCircle,
  Calendar,
  ExternalLink,
  Shield,
  Award,
  TrendingUp,
  Users,
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle,
  Plus,
  Minus,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { CasinoReview } from "@/lib/types"
import { ExpertReviewsRealtimeRefresher } from "@/components/reviews/expert-reviews-realtime-refresher"
import { CasinoScreenshotsSection } from "@/components/casino-screenshots-section"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// ISR caching - revalidate every 15 minutes for dynamic content
export const revalidate = 900

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const casinoId = slug.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)?.[1]

  const { data: casino } = await supabase.from("casinos").select("name").eq("id", casinoId).single()

  return {
    title: `${casino?.name || "Casino"} Expert Review - GuruSingapore`,
    description: `Read our comprehensive expert review of ${casino?.name || "this casino"}. Professional analysis, ratings, and detailed insights from our expert team.`,
  }
}

export default async function ExpertReviewDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const casinoId = slug.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)?.[1]

  if (!casinoId) {
    notFound()
  }

  const { data: casino } = await supabase.from("casinos").select("*").eq("id", casinoId).single()

  if (!casino) {
    notFound()
  }

  const { data: expertReview } = await supabase
    .from("casino_reviews")
    .select("*")
    .eq("casino_id", casinoId)
    .eq("is_published", true)
    .single()

  if (!expertReview) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-400"
    if (rating >= 4) return "text-green-400"
    if (rating >= 3) return "text-yellow-400"
    if (rating >= 2) return "text-orange-400"
    return "text-red-400"
  }

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.5) return "bg-emerald-500/20 border-emerald-500/30"
    if (rating >= 4) return "bg-green-500/20 border-green-500/30"
    if (rating >= 3) return "bg-yellow-500/20 border-yellow-500/30"
    if (rating >= 2) return "bg-orange-500/20 border-orange-500/30"
    return "bg-red-500/20 border-red-500/30"
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent"
    if (rating >= 4) return "Very Good"
    if (rating >= 3) return "Good"
    if (rating >= 2) return "Fair"
    return "Poor"
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://gurusingapore.com/#organization",
        "name": "GuruSingapore",
        "url": "https://gurusingapore.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://gurusingapore.com/logo.png"
        },
        "description": "Singapore's premier online casino review platform providing expert analysis and professional insights."
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://gurusingapore.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Expert Reviews",
            "item": "https://gurusingapore.com/expert-reviews"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${casino.name} Expert Review`,
            "item": `https://gurusingapore.com/expert-reviews/${slug}`
          }
        ]
      },
      {
        "@type": "Review",
        "name": `Expert Review of ${casino.name}`,
        "reviewBody": expertReview.content,
        "author": {
          "@type": "Organization",
          "name": "GuruSingapore Expert Team"
        },
        "datePublished": expertReview.created_at,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": expertReview.rating,
          "bestRating": 10,
          "worstRating": 1
        },
        "itemReviewed": {
          "@type": "Organization",
          "name": casino.name,
          "url": casino.website_url
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header with Back Button */}
      <div className="pt-20 sm:pt-24 md:pt-28 pb-4 sm:pb-6 md:pb-8">
        {/* Mobile-only plain link without wrapper */}
        <Link href="/expert-reviews" className="sm:hidden inline-flex items-center gap-2 text-[#00ff88] hover:text-[#00ff88]/80 mb-4 font-semibold text-xs px-3">
          <ArrowLeft className="w-3 h-3" />
          Back to Expert Reviews
        </Link>
        <div className="container mx-auto px-3 sm:px-4">
          <Button
            variant="outline"
            className="hidden sm:inline-flex border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 mb-4 sm:mb-6 md:mb-8 font-semibold text-xs sm:text-sm"
            asChild
          >
            <Link href="/expert-reviews">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Back to Expert Reviews
            </Link>
          </Button>

          <div className="mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
              Expert Review: {casino.name}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-4xl">
              Comprehensive professional analysis of {casino.name} by our expert team. Get detailed insights into games, 
              security, customer service, and overall gaming experience from industry professionals.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12 md:pb-16">
        <ExpertReviewsRealtimeRefresher casinoId={casino.id} />
        
        {/* Casino Overview */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <GlassCard className="p-4 sm:p-6 md:p-8 border border-white/10">
            <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 md:gap-12">
              {/* Casino Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                  {/* Casino Logo */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 mx-auto sm:mx-0">
                    {casino.logo_url ? (
                      <Image
                        src={casino.logo_url || "/placeholder.svg"}
                        alt={`${casino.name} logo`}
                        width={128}
                        height={128}
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl sm:text-3xl md:text-4xl">{casino.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">{casino.name}</h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-full">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#00ff88]" />
                        <span className="text-[#00ff88] font-semibold text-xs sm:text-sm">Safety Score: {casino.rating}/10</span>
                      </div>
                      {casino.license && (
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold text-xs sm:text-sm">Licensed & Regulated</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-xs sm:text-sm">Expert Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {casino.description && (
                  <div className="mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">{casino.description}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {casino.website_url && (
                    <Button
                      className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm"
                      asChild
                    >
                      <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Casino
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-2 border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm"
                    asChild
                  >
                    <Link href={`/casinos/${casino.id}`}>Full Casino Info</Link>
                  </Button>
                </div>
              </div>

              {/* Expert Rating Summary (simplified, no extra card) */}
              <div className="xl:w-96">
                <div className="p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff88]" />
                    <h3 className="text-lg sm:text-xl font-bold text-white">Expert Rating</h3>
                  </div>

                  <div className="text-center mb-6 sm:mb-8">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 ${getRatingBgColor(expertReview.rating)} mb-3 sm:mb-4`}
                    >
                      <div className="text-center">
                        <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${getRatingColor(expertReview.rating)}`}>
                          {expertReview.rating}/10
                        </div>
                        <div className="text-xs text-gray-400">out of 10</div>
                      </div>
                    </div>
                    <div className={`text-base sm:text-lg font-semibold ${getRatingColor(expertReview.rating)} mb-1`}>
                      {getRatingLabel(expertReview.rating)}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">Professional assessment</div>
                  </div>

                  {/* Review Meta */}
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Review Date</span>
                      <span className="text-white font-medium text-sm">{formatDate(expertReview.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Author</span>
                      <span className="text-white font-medium text-sm">{expertReview.author_name || "Expert Team"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Status</span>
                      <span className="text-emerald-400 font-medium text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Published
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Expert Review Content (no wrapper) */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">{expertReview.title}</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatDate(expertReview.created_at)}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Expert Analysis
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {expertReview.updated_at !== expertReview.created_at ? "Updated" : "Published"}
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg whitespace-pre-wrap">{expertReview.content}</p>
          </div>

          {/* Pros and Cons */}
          {(expertReview.pros?.length > 0 || expertReview.cons?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
              {expertReview.pros?.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-3 sm:mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Pros
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {expertReview.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300 text-sm sm:text-base">
                        <Plus className="w-4 h-4 text-emerald-400 mt-1.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expertReview.cons?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-3 sm:mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cons
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {expertReview.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300 text-sm sm:text-base">
                        <Minus className="w-4 h-4 text-red-400 mt-1.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Casino Screenshots Section (no card wrapper) */}
        <div className="mb-8 sm:mb-12 md:mb-16 px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Casino Screenshots & Visuals</h2>
          <CasinoScreenshotsSection casinoId={casino.id} />
        </div>

        {/* Related Links (no card wrapper) */}
        <div className="mb-8 sm:mb-12 md:mb-16 px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Related Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 font-semibold p-3 sm:p-4 h-auto flex-col gap-2 text-xs sm:text-sm"
              asChild
            >
              <Link href={`/reviews/${casino.id}-${casino.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Read Player Reviews</span>
                <span className="text-xs text-gray-400">Community feedback</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 font-semibold p-3 sm:p-4 h-auto flex-col gap-2 text-xs sm:text-sm"
              asChild
            >
              <Link href={`/casinos/${casino.id}`}>
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Casino Details</span>
                <span className="text-xs text-gray-400">Complete information</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer is now rendered from RootLayout */}
    </div>
  )
}
