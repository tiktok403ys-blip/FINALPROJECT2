import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  ExternalLink,
  Shield,
  Award,
  TrendingUp,
  Users,
  Clock,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Review } from "@/lib/types"
import { WriteReviewForm } from "@/components/reviews/write-review-form"
import { HelpfulVote } from "@/components/reviews/helpful-vote"
import { ReviewsRealtimeRefresher } from "@/components/reviews/realtime-refresher"

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
    title: `${casino?.name || "Casino"} Reviews - GuruSingapore`,
    description: `Read honest reviews from real players about ${casino?.name || "this casino"}. Share your own experience and help the community make informed decisions.`,
  }
}

export default async function ReviewsPage({ params }: PageProps) {
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

  const { data: reviews } = await supabase
    .from("player_reviews")
    .select("*")
    .eq("is_approved", true)
    .eq("casino_id", casinoId)
    .order("created_at", { ascending: false })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getRatingDistribution = () => {
    if (!reviews || reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      const rating = review.rating || 0
      if (rating >= 1 && rating <= 5) {
        distribution[Math.floor(rating) as keyof typeof distribution]++
      }
    })

    return distribution
  }

  const calculateDetailedAverages = () => {
    if (!reviews || reviews.length === 0) return { gameVariety: 0, customerService: 0, payoutSpeed: 0 }

    const totals = {
      gameVariety: 0,
      customerService: 0,
      payoutSpeed: 0,
      counts: { gameVariety: 0, customerService: 0, payoutSpeed: 0 },
    }

    reviews.forEach((review) => {
      if (review.game_variety_rating) {
        totals.gameVariety += review.game_variety_rating
        totals.counts.gameVariety++
      }
      if (review.customer_service_rating) {
        totals.customerService += review.customer_service_rating
        totals.counts.customerService++
      }
      if (review.payout_speed_rating) {
        totals.payoutSpeed += review.payout_speed_rating
        totals.counts.payoutSpeed++
      }
    })

    return {
      gameVariety: totals.counts.gameVariety > 0 ? (totals.gameVariety / totals.counts.gameVariety).toFixed(1) : 0,
      customerService:
        totals.counts.customerService > 0 ? (totals.customerService / totals.counts.customerService).toFixed(1) : 0,
      payoutSpeed: totals.counts.payoutSpeed > 0 ? (totals.payoutSpeed / totals.counts.payoutSpeed).toFixed(1) : 0,
    }
  }

  const averageRating = calculateAverageRating()
  const ratingDistribution = getRatingDistribution()
  const totalReviews = reviews?.length || 0
  const detailedAverages = calculateDetailedAverages()

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
        "description": "Singapore's premier online casino review platform providing honest insights and expert analysis."
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
            "name": "Casino Reviews",
            "item": "https://gurusingapore.com/reviews"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${casino.name} Reviews`,
            "item": `https://gurusingapore.com/reviews/${slug}`
          }
        ]
      },
      {
        "@type": "Organization",
        "name": casino.name,
        "url": casino.website_url,
        "description": casino.description,
        "logo": casino.logo_url ? {
          "@type": "ImageObject",
          "url": casino.logo_url
        } : undefined,
        "aggregateRating": totalReviews > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": averageRating,
          "reviewCount": totalReviews,
          "bestRating": 5,
          "worstRating": 1
        } : undefined
      },
      ...(reviews?.slice(0, 5).map((review) => ({
        "@type": "Review",
        "name": `Review of ${casino.name}`,
        "reviewBody": review.review_text,
        "author": {
          "@type": "Person",
          "name": review.player_name || "Anonymous Player"
        },
        "datePublished": review.created_at,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": 5,
          "worstRating": 1
        },
        "itemReviewed": {
          "@type": "Organization",
          "name": casino.name,
          "url": casino.website_url
        }
      })) || [])
    ]
  }

  return (
    <div className="min-h-screen bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header with Back Button - Fixed navbar overlap */}
      <div className="pt-28 pb-8">
        {/* Mobile-only plain back link */}
        <Link href="/casinos" className="sm:hidden inline-flex items-center gap-2 text-[#00ff88] hover:text-[#00ff88]/80 mb-4 font-semibold text-xs px-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Casinos
        </Link>
        <div className="container mx-auto px-4">
          <Button
            variant="outline"
            className="hidden sm:inline-flex border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 mb-8 font-semibold"
            asChild
          >
            <Link href="/casinos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Casinos
            </Link>
          </Button>

          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {casino.name} Reviews
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed max-w-4xl">
              Read authentic reviews from players who have experienced {casino.name}. Get insights into games, customer
              service, payouts, and overall gaming experience from our verified community.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <ReviewsRealtimeRefresher casinoId={casino.id} />
        {/* Casino Overview - Enhanced */}
        <div className="mb-16">
          <GlassCard className="p-8 border border-white/10">
            <div className="flex flex-col xl:flex-row gap-12">
              {/* Casino Info */}
              <div className="flex-1">
                <div className="flex items-start gap-8 mb-8">
                  {/* Enhanced Logo - Made Wider and Bigger */}
                  <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
                    {casino.logo_url ? (
                      <Image
                        src={casino.logo_url || "/placeholder.svg"}
                        alt={`${casino.name} logo`}
                        width={128}
                        height={128}
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-white font-bold text-4xl">{casino.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-3">{casino.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-full">
                        <Shield className="w-4 h-4 text-[#00ff88]" />
                        <span className="text-[#00ff88] font-semibold text-sm">Safety Score: {casino.rating}/10</span>
                      </div>
                      {casino.license && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold text-sm">Licensed & Regulated</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-sm">{totalReviews} Reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {casino.description && (
                  <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-gray-300 leading-relaxed text-lg">{casino.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {casino.website_url && (
                    <Button
                      className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Casino
                        <ExternalLink className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-2 border-[#00ff88]/50 text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10 font-semibold px-8 py-3 rounded-xl transition-all duration-300"
                    asChild
                  >
                    <Link href={`/casinos/${casino.id}`}>Full Casino Review</Link>
                  </Button>
                </div>
              </div>

              {/* Enhanced Rating Summary */}
              <div className="xl:w-96">
                <GlassCard className="p-8 border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-[#00ff88]" />
                    <h3 className="text-xl font-bold text-white">Player Ratings</h3>
                  </div>

                  <div className="text-center mb-8">
                    <div
                      className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${getRatingBgColor(Number.parseFloat(averageRating.toString()))} mb-4`}
                    >
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getRatingColor(Number.parseFloat(averageRating.toString()))}`}>
                          {averageRating}
                        </div>
                        <div className="text-xs text-gray-400">out of 5</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(Number.parseFloat(averageRating.toString()))
                              ? "text-[#00ff88] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <div className={`text-lg font-semibold ${getRatingColor(Number.parseFloat(averageRating.toString()))} mb-1`}>
                      {getRatingLabel(Number.parseFloat(averageRating.toString()))}
                    </div>
                    <div className="text-gray-400 text-sm">Based on {totalReviews} verified reviews</div>
                  </div>

                  {/* Enhanced Rating Distribution */}
                  <div className="space-y-3 mb-8">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingDistribution[rating as keyof typeof ratingDistribution]
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-gray-300 text-sm font-medium">{rating}</span>
                            <Star className="w-3 h-3 text-[#00ff88] fill-current" />
                          </div>
                          <div className="flex-1 bg-gray-800/50 rounded-full h-3 border border-gray-700/50">
                            <div
                              className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] h-3 rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400 text-sm w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Detailed Ratings Summary */}
                  {(Number.parseFloat(detailedAverages.gameVariety.toString()) > 0 ||
                    Number.parseFloat(detailedAverages.customerService.toString()) > 0 ||
                    Number.parseFloat(detailedAverages.payoutSpeed.toString()) > 0) && (
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                        Category Breakdown
                      </h4>
                      <div className="space-y-3">
                        {Number.parseFloat(detailedAverages.gameVariety.toString()) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Game Variety</span>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Number.parseFloat(detailedAverages.gameVariety.toString())
                                        ? "text-[#00ff88] fill-current"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-white font-medium text-sm">{detailedAverages.gameVariety}</span>
                            </div>
                          </div>
                        )}

                        {Number.parseFloat(detailedAverages.customerService.toString()) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Customer Service</span>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Number.parseFloat(detailedAverages.customerService.toString())
                                        ? "text-[#00ff88] fill-current"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-white font-medium text-sm">{detailedAverages.customerService}</span>
                            </div>
                          </div>
                        )}

                        {Number.parseFloat(detailedAverages.payoutSpeed.toString()) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Payout Speed</span>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(Number.parseFloat(detailedAverages.payoutSpeed.toString()))
                                        ? "text-[#00ff88] fill-current"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-white font-medium text-sm">{detailedAverages.payoutSpeed}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Reviews Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Player Reviews</h2>
              <p className="text-gray-400">Real experiences from verified players ({totalReviews} reviews)</p>
            </div>
            <div className="w-full sm:w-auto">
              <WriteReviewForm casinoId={casino.id} />
            </div>
          </div>

          {reviews?.map((review: Review, index: number) => (
            <GlassCard
              key={review.id}
              className={`p-8 border border-white/10 hover:border-white/20 transition-all duration-300 ${index === 0 ? "ring-2 ring-[#00ff88]/20" : ""}`}
            >
              {index === 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-[#00ff88] text-sm font-semibold">Most Recent Review</span>
                </div>
              )}

              {/* Enhanced Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold text-lg">
                      {review.reviewer_name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{review.reviewer_name || "Anonymous Player"}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                       {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-bold text-lg ${getRatingColor(review.rating || 0)}`}>
                        {review.rating}/5
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingBgColor(review.rating || 0)}`}
                      >
                        {getRatingLabel(review.rating || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm bg-white/5 px-3 py-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  {formatDate(review.created_at)}
                </div>
              </div>

              {/* Enhanced Review Content */}
              <div className="mb-8">
                <h4 className="text-white font-bold text-xl mb-4 leading-tight">{review.title}</h4>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed text-lg">{review.content}</p>
                </div>
              </div>

              {/* Enhanced Detailed Ratings */}
               {(review.game_variety_rating || review.customer_service_rating || review.payout_speed_rating) && (
                <div className="mb-8 p-6 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl">
                  <h5 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#00ff88]" />
                    Detailed Category Ratings
                  </h5>
                  <div className="grid sm:grid-cols-3 gap-6">
                    {review.game_variety_rating && (
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-gray-400 text-sm font-medium mb-2">Game Variety</div>
                        <div className="flex items-center justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(review.game_variety_rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          </div>
                          <div className="text-white font-bold text-lg">{review.game_variety_rating}/5</div>
                      </div>
                    )}

                    {review.customer_service_rating && (
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-gray-400 text-sm font-medium mb-2">Customer Service</div>
                        <div className="flex items-center justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(review.customer_service_rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          </div>
                          <div className="text-white font-bold text-lg">{review.customer_service_rating}/5</div>
                      </div>
                    )}

                    {review.payout_speed_rating && (
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-gray-400 text-sm font-medium mb-2">Payout Speed</div>
                        <div className="flex items-center justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(review.payout_speed_rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          </div>
                          <div className="text-white font-bold text-lg">{review.payout_speed_rating}/5</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Review Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/10">
                <HelpfulVote reviewId={review.id} helpful={review.helpful_count || 0} notHelpful={review.not_helpful_count || 0} />
                <div className="ml-auto text-gray-500 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Verified Review</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {!reviews?.length && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
              <MessageCircle className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">No Reviews Yet</h3>
            <p className="text-gray-400 text-xl mb-8 max-w-md mx-auto">
              Be the first to share your experience with {casino.name} and help other players make informed decisions!
            </p>
            <Button className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <MessageCircle className="w-5 h-5 mr-2" />
              Write the First Review
            </Button>
          </div>
        )}
      </div>

      {/* Footer is now rendered from RootLayout */}
    </div>
  )
}
