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

export const metadata = {
  title: "Best Online Casinos - GuruSingapore",
  description:
    "Discover the best online casinos with verified reviews, ratings, and exclusive bonuses. Find your perfect casino today.",
}

// Revalidate every 2 hours for casino listings
export const revalidate = 7200

export default async function CasinosPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams

  // Sanitize filter to known values
  const allowedFilters = new Set(['all', 'high-rated', 'new', 'live'])
  const rawFilter = typeof resolvedSearchParams?.filter === 'string' ? resolvedSearchParams?.filter : undefined
  const filter = allowedFilters.has(rawFilter || '') ? (rawFilter as 'all' | 'high-rated' | 'new' | 'live') : 'all'

  let query = supabase.from("casinos").select("*")

  // Apply filters based on query param
  if (filter === 'high-rated') {
    // Only include clearly high-rated casinos; null ratings are naturally excluded
    query = query.gte('rating', 7)
  } else if (filter === 'new') {
    // Consider "new" as created within the last 3 months
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    query = query.gte('created_at', threeMonthsAgo.toISOString())
  } else if (filter === 'live') {
    // Heuristic: match common fields for "live" support without relying on schema changes
    // Matches description, bonus_info, or name containing "live" (case-insensitive)
    // Example: "live dealer", "live casino", etc.
    query = query.or('description.ilike.%live%,bonus_info.ilike.%live%,name.ilike.%live%')
  }

  // Ordering strategy per filter; push nulls last to avoid unstable ordering
  if (filter === 'new') {
    query = query.order('created_at', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('rating', { ascending: false, nullsFirst: false })
  }

  const { data: casinos } = await query

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
        fallbackTitle="Best Online Casinos for December 2024 - Expert Picks You Can Trust"
        fallbackDescription="We&apos;ve reviewed more than 7,000 online casinos to bring you the TOP 10 for December. Each is rated using our unique Safety Index - developed by experts, grounded in real casino data, and shaped by insights from our active community. Find the best online casino for you."
        breadcrumbs={[{ label: "Best online casinos" }]}
        author={{ name: "GuruSingapore Team" }}
        date="10 Dec 2024"
      />

      <div className="container mx-auto px-4 py-16">
        {/* Filter Section */}
        <div className="mb-12">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5" />
                <span className="font-semibold">Filter Casinos:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className={filter === 'all' ? 'border-[#00ff88] text-[#00ff88] bg-transparent' : 'border-gray-600 text-gray-400 bg-transparent'}
                  asChild
                >
                  <Link href="/casinos">All Casinos</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={filter === 'high-rated' ? 'border-[#00ff88] text-[#00ff88] bg-transparent' : 'border-gray-600 text-gray-400 bg-transparent'}
                  asChild
                >
                  <Link href="/casinos?filter=high-rated">High Rated</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={filter === 'new' ? 'border-[#00ff88] text-[#00ff88] bg-transparent' : 'border-gray-600 text-gray-400 bg-transparent'}
                  asChild
                >
                  <Link href="/casinos?filter=new">New Casinos</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={filter === 'live' ? 'border-[#00ff88] text-[#00ff88] bg-transparent' : 'border-gray-600 text-gray-400 bg-transparent'}
                  asChild
                >
                  <Link href="/casinos?filter=live">Live Casino</Link>
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Casinos List - Horizontal Cards with Logo Section */}
        <div className="space-y-6">
          {casinos?.map((casino: Casino) => {
            const ratingBadge = getRatingBadge(casino.rating || 0)
            const slug = createSlug(casino.name)

            return (
              <GlassCard
                key={casino.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-[#00ff88]/30 group"
              >
                <div className="flex flex-col lg:flex-row min-h-[200px]">
                  {/* Left Side - Logo Section (Dark Background) */}
                  <div className="lg:w-1/4 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/20 to-transparent"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,136,0.1),transparent_50%)]"></div>
                    </div>

                    {/* Logo Container */}
                    <div className="relative z-10 w-full max-w-[120px] h-[80px] flex items-center justify-center">
                      {casino.logo_url ? (
                        <Image
                          src={casino.logo_url || "/placeholder.svg"}
                          alt={`${casino.name} logo`}
                          width={120}
                          height={80}
                          className="max-w-full max-h-full object-contain filter brightness-110"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-white font-bold text-2xl mb-1">
                            {casino.name
                              .split(" ")
                              .map((word) => word.charAt(0))
                              .join("")
                              .slice(0, 3)}
                          </div>
                          <div className="text-[#00ff88] text-xs font-medium tracking-wider">CASINO</div>
                        </div>
                      )}
                    </div>

                    {/* Ranking Badge */}
                    <div className="absolute top-4 left-4 bg-[#00ff88] text-black text-xs font-bold px-2 py-1 rounded">
                      #{casinos?.indexOf(casino) + 1 || 1}
                    </div>
                  </div>

                  {/* Right Side - Casino Information */}
                  <div className="lg:w-3/4 p-6 flex flex-col justify-between">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Casino Details */}
                      <div className="lg:w-2/3 space-y-4">
                        {/* Header */}
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">{casino.name}</h3>

                          {/* Rating */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center">
                              <Shield className={`w-5 h-5 mr-2 ${getRatingColor(casino.rating || 0)}`} />
                              <span className="text-white font-semibold">SAFETY INDEX:</span>
                              <span className={`font-bold ml-2 text-lg ${getRatingColor(casino.rating || 0)}`}>
                                {casino.rating || "N/A"}
                              </span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold border ${ratingBadge.color}`}
                            >
                              {ratingBadge.text.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2">
                          {casino.license && (
                            <div className="flex items-center text-green-400 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                              <span>Licensed & Regulated Casino</span>
                            </div>
                          )}

                          <div className="flex items-center text-green-400 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                            <span>Website supports Singapore players</span>
                          </div>

                          <div className="flex items-center text-green-400 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                            <span>Fast withdrawal processing based on players experience</span>
                          </div>

                          <div className="flex items-center text-yellow-400 text-sm">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                            <span>Live chat is available 24/7, but not for all languages</span>
                          </div>

                          {casino.location && (
                            <div className="flex items-center text-gray-400 text-sm">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>International casino - {casino.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {casino.description && (
                          <p className="text-gray-400 text-sm leading-relaxed">{casino.description}</p>
                        )}
                      </div>

                      {/* Actions Section */}
                      <div className="lg:w-1/3 space-y-4">
                        {/* Bonus Info */}
                        {casino.bonus_info && (
                          <div className="p-4 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
                            <div className="text-center">
                              <div className="text-[#00ff88] font-bold text-lg mb-1 flex items-center justify-center gap-2">
                                <Gift className="w-5 h-5" />
                                BONUS: {casino.bonus_info}
                              </div>
                              <div className="text-xs text-gray-400">*T&Cs apply</div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          {casino.website_url && (
                            <Button
                              className="w-full bg-[#00ff88] text-black hover:bg-[#00ff88]/80 font-bold py-3 text-lg"
                              asChild
                            >
                              <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                                <Play className="w-5 h-5 mr-2" />
                                Visit Casino
                              </Link>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            className="w-full border-purple-500 text-purple-400 bg-transparent hover:bg-purple-500/10"
                            asChild
                          >
                            <Link href={`/casinos/${casino.id}`}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Read Review
                            </Link>
                          </Button>
                        </div>

                        {/* Additional Info */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            Website: 51 languages
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-3 h-3" />
                            Live chat: 6 languages
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Customer support: 6 languages
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        {!casinos?.length && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Casinos Found</h3>
            <p className="text-gray-400 text-lg">We&apos;re working on adding more casinos to our database.</p>
          </div>
        )}

        {/* How GuruSingapore Helps Section */}
        <div className="mt-20 mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              How GuruSingapore can help you make the right choice
            </h2>
            <div className="w-24 h-1 bg-[#00ff88] mx-auto mb-16"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <Database className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Up-to-date data on all real money online casinos</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We review over 7,000 real money casino sites, ensuring one of the widest and most up to date
                  selections on the market. Our focus on fairness and safety helps you confidently choose the best
                  platforms to play on.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Independent casino review team</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  A dedicated team of nearly 20 reviewers applies a consistent, data-driven methodology, resulting in
                  in-depth casino evaluations that prioritize player protection.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Methodical and objective reviews</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Each casino is scored using a Safety Index based on over 20 factors, such as T&C fairness, casino
                  size, and complaint resolution. This data-driven approach guarantees unbiased and uniform results.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <UserCheck className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Casino testers all around the world</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our global reach is reflected in our testing team, which includes local experts from the most popular
                  gambling regions. Their insights ensure tailored information for players from all over the world.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <Scale className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Ensuring fairness and player safety</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We evaluate casinos on fairness and safety, actively pushing operators to remove unfair terms, resolve
                  disputes appropriately, and uphold transparent practices. We resolved over 14K complaints in favor of
                  the player.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto">
                  <Globe className="w-10 h-10 text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-bold text-white">Enhanced by millions of casino players</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  GuruSingapore is powered by a thriving community, including 600,000+ registered forum users and
                  millions of site visitors worldwide. Their shared experiences and feedback help us keep our content
                  accurate, practical, and player focused.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Method Section */}
        <div className="mt-20 mb-16">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Our method, your safety: how we rate casinos
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                The team at GuruSingapore methodically reviews each casino site listed on our website, focusing on
                fairness and safety. This is achieved through a ranking system we call the Safety Index. The higher the
                Safety Index, the more likely you are to enjoy your real money online casino games and cash out your
                winnings without issues.
              </p>

              <p className="text-gray-300 mb-12">
                You can see the Safety Index next to each casino listed above is based on several factors, such as:
              </p>

              <div className="space-y-10">
                {/* Fairness of terms and conditions */}
                <div className="border-l-4 border-[#00ff88] pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-[#00ff88]" />
                    <h3 className="text-2xl font-bold text-white">Fairness of terms and conditions</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    GuruSingapore reviews each casino&apos;s Terms and Conditions (T&Cs) to identify clauses that may be
                    unfair, misleading, or potentially harmful to players. Such clauses can adversely affect a casino&apos;s
                    Safety Index. Over 600 casinos have amended their T&Cs based on GuruSingapore&apos;s recommendations.
                  </p>
                </div>

                {/* Casino size */}
                <div className="border-l-4 border-[#00ff88] pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building className="w-6 h-6 text-[#00ff88]" />
                    <h3 className="text-2xl font-bold text-white">Casino size</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    The size of a casino, often indicative of its financial stability and ability to pay out substantial
                    winnings, is a critical factor in the Safety Index. Larger casinos are generally deemed safer due to
                    their resources and established reputation, whereas smaller casinos may face challenges in
                    fulfilling large payouts.
                  </p>
                </div>

                {/* Player complaints */}
                <div className="border-l-4 border-[#00ff88] pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-6 h-6 text-[#00ff88]" />
                    <h3 className="text-2xl font-bold text-white">Player complaints</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    GuruSingapore&apos;s{" "}
                    <Link href="/reports" className="text-[#00ff88] hover:underline">
                      Complaint Resolution Center
                    </Link>{" "}
                    has handled over 53,000 complaints, providing valuable insights into how casinos treat their
                    players. Each complaint is assessed for validity, and justified complaints that remain unresolved
                    negatively impact the casino&apos;s Safety Index. This thorough evaluation ensures that the Safety Index
                    accurately reflects a casino&apos;s commitment to fair play.
                  </p>
                </div>

                {/* Casino blacklists */}
                <div className="border-l-4 border-red-500 pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="text-2xl font-bold text-white">Casino blacklists</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Inclusion of reputable blacklists, including{" "}
                    <Link href="/reports" className="text-[#00ff88] hover:underline">
                      GuruSingapore&apos;s own blacklist
                    </Link>
                    , signals potential issues with a casino&apos;s operations. Such listings are factored into the Safety
                    Index, with blacklisted casinos receiving lower scores. This approach helps players avoid platforms
                    with a history of unethical practices.
                  </p>
                </div>
              </div>

              <div className="mt-12 p-6 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-[#00ff88] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#00ff88] font-bold text-lg mb-2">Our Commitment to Player Safety</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Every casino listed on GuruSingapore undergoes rigorous evaluation using our comprehensive Safety
                      Index. We continuously monitor and update our assessments to ensure you have access to the most
                      current and reliable information when choosing where to play.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="mt-16">
          <GlassCard className="p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">How We Rate Casinos</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <Shield className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2">Security & Licensing</h4>
                <p className="text-gray-400">We verify licenses, encryption, and regulatory compliance.</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2">Player Experience</h4>
                <p className="text-gray-400">Real player reviews and community feedback matter.</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
                <h4 className="text-[#00ff88] font-semibold mb-2">Game Quality</h4>
                <p className="text-gray-400">We evaluate game variety, software providers, and fairness.</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
              <p className="text-gray-300 text-center">
                <strong className="text-[#00ff88]">Responsible Gaming:</strong> All featured casinos promote responsible
                gambling and provide tools to help players stay in control.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}
