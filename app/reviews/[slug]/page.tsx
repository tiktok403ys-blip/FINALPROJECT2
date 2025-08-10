import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, MessageCircle, ThumbsUp, ThumbsDown, Calendar, ExternalLink, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { notFound } from "next/navigation"
import type { Review } from "@/lib/types"

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient()
  const casinoId = params.slug.split("-").pop()

  const { data: casino } = await supabase.from("casinos").select("name").eq("id", casinoId).single()

  return {
    title: `${casino?.name || "Casino"} Reviews - GuruSingapore`,
    description: `Read honest reviews from real players about ${casino?.name || "this casino"}. Share your own experience and help the community make informed decisions.`,
  }
}

export default async function CasinoReviewsPage({ params }: PageProps) {
  const supabase = await createClient()
  const casinoId = params.slug.split("-").pop()

  if (!casinoId) {
    notFound()
  }

  const { data: casino } = await supabase.from("casinos").select("*").eq("id", casinoId).single()

  if (!casino) {
    notFound()
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
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
    if (rating >= 4) return "text-green-400"
    if (rating >= 3) return "text-yellow-400"
    if (rating >= 2) return "text-orange-400"
    return "text-red-400"
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

  const averageRating = calculateAverageRating()
  const ratingDistribution = getRatingDistribution()
  const totalReviews = reviews?.length || 0

  return (
    <div className="min-h-screen bg-black">
      <PageHeader
        title={`${casino.name} Reviews`}
        description={`Read authentic reviews from players who have experienced ${casino.name}. Get insights into games, customer service, payouts, and overall gaming experience from our verified community.`}
        breadcrumbs={[{ label: "Reviews", href: "/reviews" }, { label: `${casino.name} Reviews` }]}
        author="GuruSingapore Community"
        date={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      />

      <div className="container mx-auto px-4 py-16">
        {/* Casino Overview */}
        <div className="mb-12">
          <GlassCard className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Casino Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                    {casino.logo_url ? (
                      <Image
                        src={casino.logo_url || "/placeholder.svg"}
                        alt={`${casino.name} logo`}
                        width={64}
                        height={64}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl">{casino.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{casino.name}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-[#00ff88] mr-1" />
                        <span className="text-[#00ff88] font-semibold">Safety: {casino.rating}/10</span>
                      </div>
                      {casino.license && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Licensed</span>
                      )}
                    </div>
                  </div>
                </div>

                {casino.description && <p className="text-gray-300 leading-relaxed mb-6">{casino.description}</p>}

                <div className="flex gap-4">
                  {casino.website_url && (
                    <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                      <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Casino
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                    <Link href={`/casinos/${casino.id}`}>Full Review</Link>
                  </Button>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="lg:w-80">
                <GlassCard className="p-6">
                  <h3 className="text-white font-semibold mb-4">Player Ratings</h3>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-[#00ff88] mb-2">{averageRating}</div>
                    <div className="flex items-center justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(Number.parseFloat(averageRating))
                              ? "text-[#00ff88] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-gray-400 text-sm">Based on {totalReviews} reviews</div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingDistribution[rating as keyof typeof ratingDistribution]
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                      return (
                        <div key={rating} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 w-6">{rating}★</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-[#00ff88] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400 w-8">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Player Reviews ({totalReviews})</h2>
            <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">Write a Review</Button>
          </div>

          {reviews?.map((review: Review) => (
            <GlassCard key={review.id} className="p-8">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">{review.reviewer_name?.charAt(0).toUpperCase() || "A"}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{review.reviewer_name || "Anonymous Player"}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-semibold ${getRatingColor(review.rating || 0)}`}>{review.rating}/5</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {formatDate(review.created_at)}
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                <p className="text-gray-300 leading-relaxed">{review.content}</p>
              </div>

              {/* Detailed Ratings */}
              {(review.game_variety_rating || review.customer_service_rating || review.payout_speed_rating) && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">Detailed Ratings:</h5>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {review.game_variety_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Game Variety:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.game_variety_rating ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-white">{review.game_variety_rating}/5</span>
                        </div>
                      </div>
                    )}

                    {review.customer_service_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Customer Service:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.customer_service_rating ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-white">{review.customer_service_rating}/5</span>
                        </div>
                      </div>
                    )}

                    {review.payout_speed_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Payout Speed:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.payout_speed_rating ? "text-[#00ff88] fill-current" : "text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-white">{review.payout_speed_rating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({review.helpful_count || 0})</span>
                </button>

                <button className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                  <ThumbsDown className="w-4 h-4" />
                  <span>Not Helpful ({review.not_helpful_count || 0})</span>
                </button>

                <button className="flex items-center gap-1 text-gray-400 hover:text-[#00ff88] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {!reviews?.length && (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Reviews Yet</h3>
            <p className="text-gray-400 text-lg mb-6">Be the first to share your experience with {casino.name}!</p>
            <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">Write the First Review</Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
