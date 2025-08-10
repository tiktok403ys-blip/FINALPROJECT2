import PageHero from "@/components/page-hero"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, User, Calendar, MessageCircle, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Casino Reviews - GuruSingapore",
  description:
    "Read comprehensive casino reviews from our experts and community. Get honest insights about online casinos.",
}

export default async function ReviewsPage() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from("casino_reviews")
    .select(`
      *,
      casinos (
        name,
        logo_url,
        rating
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  return (
    <div className="min-h-screen bg-black">
      <PageHero
        title="Casino Reviews for December 2024 - Real Player Experiences"
        description="Read honest and comprehensive casino reviews from our expert team and verified players. We test every aspect of online casinos including games, bonuses, payment methods, and customer support to help you make informed decisions."
        breadcrumbs={[{ label: "Casino Reviews" }]}
        author="GuruSingapore Review Team"
        date="10 Dec 2024"
      />

      <div className="container mx-auto px-4 py-16">
        {/* Review Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{reviews?.length || 0}</div>
            <div className="text-gray-400 text-sm">Total Reviews</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Star className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">4.2</div>
            <div className="text-gray-400 text-sm">Average Rating</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <ThumbsUp className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">89%</div>
            <div className="text-gray-400 text-sm">Positive Reviews</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <User className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">1,247</div>
            <div className="text-gray-400 text-sm">Verified Players</div>
          </GlassCard>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews?.map((review: any) => (
            <GlassCard key={review.id} className="p-6 hover:border-[#00ff88]/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {review.casinos?.logo_url ? (
                    <img
                      src={review.casinos.logo_url || "/placeholder.svg"}
                      alt={`${review.casinos.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Star className="w-6 h-6 text-[#00ff88]" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{review.casinos?.name}</h4>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-[#00ff88] fill-current" />
                    <span className="text-white text-sm ml-1">{review.rating}/5</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{review.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{review.content}</p>

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

              <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 w-full" asChild>
                <Link href={`/reviews/${createSlug(review.casinos?.name || "casino")}-${review.casino_id}`}>
                  Read Full Review
                </Link>
              </Button>
            </GlassCard>
          ))}
        </div>

        {!reviews?.length && (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Reviews Yet</h3>
            <p className="text-gray-400 text-lg">We're working on adding comprehensive casino reviews.</p>
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
