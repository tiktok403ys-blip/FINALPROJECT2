import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, User, Calendar, MessageCircle, ThumbsUp, Building2 } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import Image from "next/image"

export const metadata = {
  title: "Casino Reviews - GuruSingapore",
  description:
    "Read comprehensive casino reviews from our experts and community. Get honest insights about online casinos.",
}

export default async function ReviewsPage() {
  const supabase = await createClient()

  // Get casino reviews with casino data
  const { data: reviews } = await supabase
    .from("casino_reviews")
    .select(`
      *,
      casinos (
        id,
        name,
        logo_url,
        rating,
        website_url
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  // Get total stats from real data
  const { count: totalReviews } = await supabase
    .from("casino_reviews")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)

  const { count: totalCasinos } = await supabase.from("casinos").select("*", { count: "exact", head: true })

  // Calculate average rating from real reviews
  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
      : "0.0"

  // Calculate positive reviews percentage
  const positiveReviews = reviews
    ? Math.round((reviews.filter((review) => (review.rating || 0) >= 4).length / reviews.length) * 100)
    : 0

  const createSlug = (name: string, id: string) => {
    return `${id}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`
  }

  return (
    <div className="min-h-screen bg-black">
      <DynamicPageHero
        pageName="reviews"
        sectionType="hero"
        fallbackTitle="Casino Reviews for December 2024 - Real Player Experiences"
        fallbackDescription="Read honest and comprehensive casino reviews from our expert team and verified players. We test every aspect of online casinos including games, bonuses, payment methods, and customer support to help you make informed decisions."
        breadcrumbs={[{ label: "Casino Reviews" }]}
        author="GuruSingapore Review Team"
        date="10 Dec 2024"
      />

      <div className="container mx-auto px-4 py-16">
        {/* Review Stats - Real Data */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalReviews || 0}</div>
            <div className="text-gray-400 text-sm">Total Reviews</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Star className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{averageRating}</div>
            <div className="text-gray-400 text-sm">Average Rating</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <ThumbsUp className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{positiveReviews}%</div>
            <div className="text-gray-400 text-sm">Positive Reviews</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Building2 className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalCasinos || 0}</div>
            <div className="text-gray-400 text-sm">Casinos Reviewed</div>
          </GlassCard>
        </div>

        {/* Reviews Grid - Real Data */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews?.map((review: any) => (
            <GlassCard key={review.id} className="p-6 hover:border-[#00ff88]/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {review.casinos?.logo_url ? (
                    <Image
                      src={review.casinos.logo_url || "/placeholder.svg"}
                      alt={`${review.casinos.name} logo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-[#00ff88]" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{review.casinos?.name}</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (review.rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="text-white text-sm ml-1">{review.rating}/5</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{review.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{review.content}</p>

              {/* Pros and Cons */}
              {(review.pros?.length > 0 || review.cons?.length > 0) && (
                <div className="mb-4 space-y-2">
                  {review.pros?.length > 0 && (
                    <div>
                      <div className="text-green-400 text-xs font-semibold mb-1">PROS:</div>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {review.pros.slice(0, 2).map((pro: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-green-400 mt-0.5">+</span>
                            <span className="line-clamp-1">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons?.length > 0 && (
                    <div>
                      <div className="text-red-400 text-xs font-semibold mb-1">CONS:</div>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {review.cons.slice(0, 2).map((con: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">-</span>
                            <span className="line-clamp-1">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{review.author_name || "GuruSingapore"}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 w-full" asChild>
                  <Link href={`/reviews/${createSlug(review.casinos?.name || "casino", review.casino_id)}`}>
                    Read Full Review
                  </Link>
                </Button>

                {review.casinos?.website_url && (
                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-400 bg-transparent hover:bg-purple-500/10 w-full text-sm"
                    asChild
                  >
                    <Link href={review.casinos.website_url} target="_blank" rel="noopener noreferrer">
                      Visit Casino
                    </Link>
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* No Reviews State */}
        {!reviews?.length && (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Reviews Yet</h3>
            <p className="text-gray-400 text-lg mb-6">We're working on adding comprehensive casino reviews.</p>
            <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
              <Link href="/casinos">Browse Casinos</Link>
            </Button>
          </div>
        )}

        {/* Review Guidelines */}
        <div className="mt-16">
          <GlassCard className="p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Review Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-[#00ff88] font-semibold mb-3">Good Reviews Include:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Specific details about your experience</li>
                  <li>• Information about games played</li>
                  <li>• Customer service interactions</li>
                  <li>• Deposit and withdrawal experiences</li>
                  <li>• Honest pros and cons</li>
                </ul>
              </div>
              <div>
                <h4 className="text-red-400 font-semibold mb-3">Please Avoid:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Fake or misleading information</li>
                  <li>• Personal attacks or offensive language</li>
                  <li>• Sharing personal account details</li>
                  <li>• Promotional or spam content</li>
                  <li>• Reviews based on single sessions</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
              <p className="text-gray-300 text-center">
                <strong className="text-[#00ff88]">Verification:</strong> We verify reviews when possible and remove
                fake content to maintain the integrity of our community feedback.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}
