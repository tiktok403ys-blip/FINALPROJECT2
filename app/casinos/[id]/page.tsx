import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { SectionSeparator } from "@/components/section-separator"
import {
  Star,
  ExternalLink,
  Shield,
  Clock,
  CreditCard,
  Gamepad2,
  HeadphonesIcon,
  Award,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
  ArrowLeft,
} from "lucide-react"

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient()
  const { data: casino } = await supabase.from("casinos").select("name, description").eq("id", params.id).single()

  if (!casino) {
    return {
      title: "Casino Not Found - GuruSingapore",
      description: "The casino you're looking for could not be found.",
    }
  }

  return {
    title: `${casino.name} Review - Complete Guide | GuruSingapore`,
    description:
      casino.description ||
      `Comprehensive review of ${casino.name}. Read our expert analysis, player reviews, bonuses, and safety ratings.`,
  }
}

export default async function CasinoPage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: casino } = await supabase.from("casinos").select("*").eq("id", params.id).single()

  if (!casino) {
    notFound()
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("casino_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: screenshots } = await supabase
    .from("casino_screenshots")
    .select("*")
    .eq("casino_id", params.id)
    .order("display_order", { ascending: true })

  const averageRating = reviews?.length
    ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0"

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400"
    if (rating >= 6) return "text-yellow-400"
    if (rating >= 4) return "text-orange-400"
    return "text-red-400"
  }

  const getRatingBadge = (rating: number) => {
    if (rating >= 8) return { text: "Excellent", color: "bg-green-500/20 text-green-400" }
    if (rating >= 6) return { text: "Good", color: "bg-yellow-500/20 text-yellow-400" }
    if (rating >= 4) return { text: "Fair", color: "bg-orange-500/20 text-orange-400" }
    return { text: "Poor", color: "bg-red-500/20 text-red-400" }
  }

  const ratingBadge = getRatingBadge(casino.rating || 0)

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('/casino-bg-pattern.png')] opacity-5"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                className="border-[#00ff88] text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10"
                asChild
              >
                <Link href="/casinos">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Casinos
                </Link>
              </Button>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
              <Link href="/" className="hover:text-[#00ff88] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/casinos" className="hover:text-[#00ff88] transition-colors">
                Casinos
              </Link>
              <span>/</span>
              <span className="text-white">{casino.name}</span>
            </nav>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-8 mb-8">
                  <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0 p-4">
                    {casino.logo_url ? (
                      <Image
                        src={casino.logo_url || "/placeholder.svg"}
                        alt={`${casino.name} logo`}
                        width={120}
                        height={120}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-4xl">{casino.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{casino.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <Badge className={ratingBadge.color}>
                        <Star className="w-4 h-4 mr-1" />
                        {casino.rating}/10 - {ratingBadge.text}
                      </Badge>
                      {casino.license && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Shield className="w-4 h-4 mr-1" />
                          Licensed
                        </Badge>
                      )}
                      <Badge className="bg-blue-500/20 text-blue-400">
                        <Users className="w-4 h-4 mr-1" />
                        {reviews?.length || 0} Reviews
                      </Badge>
                    </div>

                    {casino.description && (
                      <p className="text-gray-300 text-lg leading-relaxed mb-6">{casino.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {casino.website_url && (
                        <Button
                          size="lg"
                          className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 font-semibold"
                          asChild
                        >
                          <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                            Visit Casino
                            <ExternalLink className="w-5 h-5 ml-2" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-[#00ff88] text-[#00ff88] bg-transparent hover:bg-[#00ff88]/10"
                        asChild
                      >
                        <Link href={`/reviews/${casino.id}-${casino.name.toLowerCase().replace(/\s+/g, "-")}`}>
                          Read Reviews
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold text-lg mb-6">Quick Overview</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Safety Rating</span>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-[#00ff88] mr-1" />
                        <span className={`font-semibold ${getRatingColor(casino.rating || 0)}`}>
                          {casino.rating}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Player Rating</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-white font-semibold">{averageRating}/5</span>
                      </div>
                    </div>

                    {casino.license && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">License</span>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Est. Year</span>
                      <span className="text-white font-semibold">{casino.established_year || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Support</span>
                      <span className="text-white font-semibold">24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionSeparator variant="gradient" />

      {/* Screenshots Gallery */}
      {screenshots && screenshots.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Casino Screenshots</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.id}
                    className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <Image
                      src={screenshot.image_url || "/placeholder.svg"}
                      alt={screenshot.title || `Screenshot ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {screenshot.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <p className="text-white font-medium p-4">{screenshot.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <SectionSeparator variant="dotted" />

      {/* Detailed Review Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Detailed Review</h2>

            <div className="space-y-12">
              {/* Games & Software */}
              <div>
                <div className="flex items-center mb-6">
                  <Gamepad2 className="w-6 h-6 text-[#00ff88] mr-3" />
                  <h3 className="text-2xl font-bold text-white">Games & Software</h3>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {casino.name} offers an extensive collection of games powered by leading software providers. The
                    platform features hundreds of slot games, table games, and live dealer options to cater to all
                    player preferences.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <Zap className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                      <h4 className="text-white font-semibold">500+ Slots</h4>
                      <p className="text-gray-400 text-sm">Latest releases</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <Award className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Live Casino</h4>
                      <p className="text-gray-400 text-sm">Real dealers</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Table Games</h4>
                      <p className="text-gray-400 text-sm">Classic favorites</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking & Payments */}
              <div>
                <div className="flex items-center mb-6">
                  <CreditCard className="w-6 h-6 text-[#00ff88] mr-3" />
                  <h3 className="text-2xl font-bold text-white">Banking & Payments</h3>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {casino.name} supports multiple payment methods for convenient deposits and withdrawals. All
                    transactions are secured with advanced encryption technology.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        Deposit Methods
                      </h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Credit/Debit Cards</li>
                        <li>• E-wallets (PayPal, Skrill)</li>
                        <li>• Bank Transfer</li>
                        <li>• Cryptocurrency</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Clock className="w-4 h-4 text-[#00ff88] mr-2" />
                        Processing Times
                      </h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• E-wallets: Instant - 24h</li>
                        <li>• Cards: 1-3 business days</li>
                        <li>• Bank Transfer: 3-5 days</li>
                        <li>• Crypto: Instant</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Support */}
              <div>
                <div className="flex items-center mb-6">
                  <HeadphonesIcon className="w-6 h-6 text-[#00ff88] mr-3" />
                  <h3 className="text-2xl font-bold text-white">Customer Support</h3>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Professional customer support team available 24/7 to assist with any questions or concerns. Multiple
                    contact methods ensure you can always get help when needed.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#00ff88] font-bold">24/7</span>
                      </div>
                      <h4 className="text-white font-semibold">Live Chat</h4>
                      <p className="text-gray-400 text-sm">Instant support</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#00ff88] font-bold">@</span>
                      </div>
                      <h4 className="text-white font-semibold">Email</h4>
                      <p className="text-gray-400 text-sm">Detailed responses</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#00ff88] font-bold">?</span>
                      </div>
                      <h4 className="text-white font-semibold">FAQ</h4>
                      <p className="text-gray-400 text-sm">Self-service</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator variant="wave" />

      {/* Recent Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Recent Player Reviews</h2>
                <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                  <Link href={`/reviews/${casino.id}-${casino.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    View All Reviews
                  </Link>
                </Button>
              </div>

              <div className="space-y-6">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-sm">
                            {review.reviewer_name?.charAt(0).toUpperCase() || "A"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{review.reviewer_name || "Anonymous"}</h4>
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
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <h5 className="text-white font-medium mb-2">{review.title}</h5>
                    <p className="text-gray-300 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
