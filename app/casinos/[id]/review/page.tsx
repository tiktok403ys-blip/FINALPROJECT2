import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Star,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Award,
  Shield,
  CreditCard,
  Headphones,
  Smartphone,
  Gift,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: casino } = await supabase.from("casinos").select("name, description, logo_url").eq("id", id).single()
  const { data: review } = await supabase
    .from("casino_reviews")
    .select("title, rating")
    .eq("casino_id", id)
    .eq("is_published", true)
    .maybeSingle()

  const title = review?.title ? `${review.title} - ${casino?.name || "Casino"}` : `${casino?.name || "Casino"} Full Review`
  const description = casino?.description || "Read the full editorial review with ratings, pros & cons, and detailed sections."
  const images = casino?.logo_url ? [casino.logo_url] : []
  const host = process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000"
  const canonical = `https://${host}/casinos/${id}/review`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  }
}

export default async function CasinoReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get casino details
  const { data: casino } = await supabase.from("casinos").select("*").eq("id", id).single()

  if (!casino) {
    notFound()
  }

  // Get review data
  const { data: review } = await supabase
    .from("casino_reviews")
    .select("*")
    .eq("casino_id", id)
    .eq("is_published", true)
    .single()

  // Get review sections
  const { data: sections } = await supabase
    .from("review_sections")
    .select("*")
    .eq("review_id", review?.id)
    .order("display_order", { ascending: true })

  const getSectionIcon = (title: string) => {
    if (title.includes("Game")) return Award
    if (title.includes("Bonus")) return Gift
    if (title.includes("Payment")) return CreditCard
    if (title.includes("Support")) return Headphones
    if (title.includes("Mobile")) return Smartphone
    return Shield
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < Math.floor(rating) ? "text-[#00ff88] fill-current" : "text-gray-600"}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Review",
                itemReviewed: {
                  "@type": "Organization",
                  name: casino.name,
                },
                reviewBody: review?.content || undefined,
                name: review?.title || `${casino.name} Review`,
                reviewRating: review?.rating
                  ? { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 0 }
                  : undefined,
                author: { "@type": "Organization", name: "GuruSingapore" },
              }),
            }}
          />
          {/* Back Button */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="text-white hover:text-[#00ff88]">
              <Link href={`/casinos/${casino.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Casino Details
              </Link>
            </Button>
          </div>

          {/* Casino Header */}
          <GlassCard className="p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Casino Logo */}
              <div className="w-48 h-24 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {casino.logo_url ? (
                  <Image
                    src={casino.logo_url || "/placeholder.svg"}
                    alt={`${casino.name} logo`}
                    width={200}
                    height={80}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">{casino.name}</span>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-4">{review?.title || `${casino.name} Review`}</h1>

                {/* Overall Rating */}
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <div className="flex items-center mr-4">
                    {renderStars(casino.rating || 0)}
                    <span className="text-white ml-2 font-semibold text-xl">{casino.rating}</span>
                    <span className="text-gray-400 ml-1">/5.0</span>
                  </div>
                  <span className="bg-[#00ff88] text-black px-3 py-1 rounded-full text-sm font-semibold">
                    {casino.rating >= 4.5
                      ? "Excellent"
                      : casino.rating >= 4.0
                        ? "Very Good"
                        : casino.rating >= 3.5
                          ? "Good"
                          : "Fair"}
                  </span>
                </div>

                <p className="text-gray-400 mb-4">{review?.content}</p>

                {review?.author_name && (
                  <p className="text-sm text-gray-500">
                    Reviewed by: <span className="text-[#00ff88]">{review.author_name}</span>
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Pros and Cons */}
          {review && (review.pros?.length > 0 || review.cons?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Pros */}
              {review.pros && review.pros.length > 0 && (
                <GlassCard className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Pros</h3>
                  </div>
                  <ul className="space-y-2">
                    {review.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Cons */}
              {review.cons && review.cons.length > 0 && (
                <GlassCard className="p-6">
                  <div className="flex items-center mb-4">
                    <XCircle className="w-6 h-6 text-red-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Cons</h3>
                  </div>
                  <ul className="space-y-2">
                    {review.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{con}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </div>
          )}

          {/* Detailed Review Sections */}
          {sections && sections.length > 0 && (
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-white text-center">Detailed Review</h2>

              {sections.map((section) => {
                const IconComponent = getSectionIcon(section.section_title)
                return (
                  <GlassCard key={section.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <IconComponent className="w-6 h-6 text-[#00ff88] mr-3" />
                        <h3 className="text-xl font-semibold text-white">{section.section_title}</h3>
                      </div>
                      <div className="flex items-center">
                        {renderStars(section.section_rating || 0)}
                        <span className="text-white ml-2 font-semibold">{section.section_rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{section.section_content}</p>
                  </GlassCard>
                )
              })}
            </div>
          )}

          {/* Final Verdict */}
          <GlassCard className="p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Final Verdict</h3>
            <div className="flex items-center justify-center mb-4">
              {renderStars(casino.rating || 0)}
              <span className="text-white ml-3 text-2xl font-bold">{casino.rating}/5.0</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Based on our comprehensive review, {casino.name}{" "}
              {casino.rating >= 4.5
                ? "is an excellent choice"
                : casino.rating >= 4.0
                  ? "is a very good option"
                  : casino.rating >= 3.5
                    ? "is a decent choice"
                    : "has room for improvement"}{" "}
              for online casino gaming.
              {casino.rating >= 4.0
                ? " We recommend this casino for both new and experienced players."
                : " Consider your gaming preferences before signing up."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {casino.website_url && (
                <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                  <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                    Visit {casino.name}
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                <Link href="/casinos">Browse More Casinos</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
