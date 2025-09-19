import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, Building2, Calendar, MessageCircle, ThumbsUp, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Expert Casino Reviews - GuruSingapore",
  description:
    "Read comprehensive expert reviews of online casinos. Get professional analysis, ratings, and detailed insights from our expert team.",
}

// ISR caching - revalidate every 30 minutes
export const revalidate = 1800

export default async function ExpertReviewsPage() {
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
        website_url,
        description
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
        "description": "Singapore's premier online casino review platform providing expert analysis and professional insights.",
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
            "item": "https://gurusingapore.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Expert Reviews",
            "item": "https://gurusingapore.com/expert-reviews"
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Expert Casino Reviews",
        "description": "Professional casino reviews and analysis",
        "numberOfItems": totalReviews || 0,
        "itemListElement": reviews?.slice(0, 10).map((review, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Review",
            "name": review.title || `${review.casinos?.name} Review`,
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": review.rating,
              "bestRating": 10
            },
            "author": {
              "@type": "Organization",
              "name": "GuruSingapore Expert Team"
            },
            "itemReviewed": {
              "@type": "Casino",
              "name": review.casinos?.name
            }
          }
        })) || []
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <DynamicPageHero
          pageName="expert-reviews"
          fallbackTitle="Expert Casino Reviews - Professional Analysis & Ratings"
          fallbackDescription="Get comprehensive expert reviews of online casinos with detailed analysis, ratings, and professional insights. Our expert team evaluates every aspect of casinos to help you make informed decisions."
          breadcrumbs={[{ label: "Expert Reviews" }]}
        />

        {/* Stats Section */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{totalReviews || 0}</div>
                <div className="text-gray-400 text-xs sm:text-sm">Expert Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{averageRating}</div>
                <div className="text-gray-400 text-xs sm:text-sm">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{positiveReviews}%</div>
                <div className="text-gray-400 text-xs sm:text-sm">Positive Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{totalCasinos || 0}</div>
                <div className="text-gray-400 text-xs sm:text-sm">Casinos Reviewed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Grid - Real Data */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">Expert Casino Reviews</h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
                Professional analysis and comprehensive reviews from our expert team
              </p>
            </div>

            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
                {reviews.map((review: any) => (
                  <GlassCard key={review.id} className="p-3 sm:p-4 md:p-6 hover:border-[#00ff88]/30 transition-colors">
                    <div className="text-center">
                      {/* Casino Logo */}
                      <div className="relative h-16 sm:h-18 md:h-20 bg-white/10 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                        {review.casinos?.logo_url ? (
                          <Image
                            src={review.casinos.logo_url}
                            alt={`${review.casinos.name} logo`}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div 
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: review.casinos?.placeholder_bg_color || '#1f2937' }}
                          >
                            <span className="text-[#00ff88] font-bold text-base sm:text-lg">{review.casinos?.name?.charAt(0) || "C"}</span>
                          </div>
                        )}
                      </div>

                      {/* Casino Name */}
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem] flex items-center justify-center" title={review.casinos?.name || "Casino"}>
                        {review.casinos?.name || "Casino"}
                      </h3>

                      {/* Review Title */}
                      {review.title && (
                        <p className="text-gray-300 mb-2 sm:mb-3 text-xs sm:text-sm line-clamp-2">{review.title}</p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                i < Math.floor((review.rating || 0) / 2)
                                  ? "text-[#00ff88] fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white ml-2 font-semibold text-sm sm:text-base">{(review.rating || 0) / 2}/5.0</span>
                      </div>

                      {/* Pros & Cons Preview */}
                      {review.pros && review.pros.length > 0 && (
                        <div className="mb-2 sm:mb-3">
                          <div className="text-xs text-gray-400 mb-1">Key Strengths:</div>
                          <div className="text-xs text-gray-300 line-clamp-2">
                            {review.pros.slice(0, 2).join(", ")}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 w-full text-xs sm:text-sm py-2 sm:py-2.5" asChild>
                          <Link href={`/expert-reviews/${review.casino_id}-${review.casinos?.name?.toLowerCase().replace(/\s+/g, "-")}`}>
                            Read Full Review
                          </Link>
                        </Button>
                        {review.casinos?.website_url && (
                          <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent w-full text-xs sm:text-sm py-2 sm:py-2.5" asChild>
                            <Link href={review.casinos.website_url} target="_blank" rel="noopener noreferrer">
                              Visit Casino
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">No Expert Reviews Yet</h3>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 px-4">
                  Our expert team is working on comprehensive casino reviews.
                </p>
                <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 text-sm sm:text-base" asChild>
                  <Link href="/casinos">Browse Casinos</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Footer is now rendered from RootLayout */}
      </div>
    </>
  )
}
