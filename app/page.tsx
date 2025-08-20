import { HeroBanner } from "@/components/hero-banner"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, TrendingUp, Trophy, Users, Shield, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import { LogoSlider } from "@/components/logo-slider"
import { WhyChooseUs, LiveStats, HowItWorks, RecentActivity } from "@/components/content-sections"
import RealtimeCasinosRefresher from "@/components/realtime-casinos-refresher"
import RealtimeHomeRefresher from "@/components/realtime-home-refresher"
import { DataPointsSeparator, ExpertAnalysisSeparator, TrustedPlatformSeparator } from "@/components/content-separator"
import type { Casino, News, Bonus } from "@/lib/types"

// Revalidate every hour for better performance
export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()

  // Site settings for hero/banner (optional row)
  const { data: settings } = await supabase.from("site_settings").select("*").limit(1).maybeSingle()

  // Fetch curated Top Rated Casinos for Home (editorial)
  const { data: topCasinos } = await supabase
    .from("casinos")
    .select("*")
    .eq("is_featured_home", true)
    .order("home_rank", { ascending: true, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(6)
  // Home hero from page_sections
  const { data: hero } = await supabase
    .from("page_sections")
    .select("title, content, image_url")
    .eq("page_name","home").eq("section_name","hero").limit(1).maybeSingle()

  // Exclusive bonuses for home
  const { data: homeBonuses } = await supabase
    .from("bonuses")
    .select(`*, casinos(name, logo_url, rating)`) // if FK exists; fallback to fields only
    .eq("is_featured_home", true)
    .eq("is_active", true)
    .order("home_rank", { ascending: true, nullsFirst: false })
    .limit(4)

  // Fetch latest news with real data
  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch featured bonuses
  const { data: featuredBonuses } = await supabase
    .from("bonuses")
    .select(`
      *,
      casinos (
        name,
        logo_url,
        rating
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4)

  // Fetch recent reviews
  const { data: recentReviews } = await supabase
    .from("casino_reviews")
    .select(`
      *,
      casinos (
        name,
        logo_url
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-black">
      {/* Realtime refresh when home data changes */}
      <RealtimeHomeRefresher />
      {/* Realtime refresh when casinos change */}
      <RealtimeCasinosRefresher filterHomeFeatured={true} />
      <HeroBanner
        imageUrl={hero?.image_url || settings?.hero_image_url || undefined}
        title={hero?.title || settings?.hero_title || undefined}
        subtitle={hero?.content || settings?.hero_subtitle || undefined}
        ctaPrimaryText={settings?.hero_cta_primary_text || undefined}
        ctaPrimaryLink={settings?.hero_cta_primary_link || undefined}
        ctaSecondaryText={settings?.hero_cta_secondary_text || undefined}
        ctaSecondaryLink={settings?.hero_cta_secondary_link || undefined}
      />

      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-12 lg:py-16 space-y-4 sm:space-y-6 md:space-y-12 lg:space-y-16">
        {/* Top Casinos Section */}
        <section>
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Top Rated Casinos</h2>
            <p className="text-gray-400 text-lg">Discover our highest-rated online casinos with verified reviews</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {topCasinos?.slice(0, 6).map((casino: Casino) => (
              <GlassCard key={casino.id} className="p-5 sm:p-6 hover:border-[#00ff88]/30 transition-colors">
                {/* Layout mengikuti gaya card di /casinos pada mobile */}
                <div className="flex flex-col sm:block">
                  {/* Logo container dengan tinggi tetap dan object-contain */}
                  <div className="w-full h-16 bg-white/10 rounded-lg flex items-center justify-center mb-4 overflow-hidden px-4">
                    {casino.logo_url ? (
                      <Image
                        src={casino.logo_url || "/placeholder.svg"}
                        alt={`${casino.name} logo`}
                        width={64}
                        height={64}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#00ff88]/20 to-[#00ff88]/10 rounded flex items-center justify-center">
                        <span className="text-[#00ff88] font-bold text-lg">{casino.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{casino.name}</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-sm line-clamp-2">{casino.description}</p>
                  <div className="flex items-center sm:justify-center mb-3 sm:mb-4">
                    <Star className="w-5 h-5 text-[#00ff88] fill-current" />
                    <span className="text-white ml-1 font-semibold">{casino.rating || "N/A"}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {casino.location && <div className="text-xs text-gray-400">Location: {casino.location}</div>}
                    {casino.bonus_info && (
                      <div className="text-xs text-[#00ff88] bg-[#00ff88]/10 px-2 py-1 rounded">
                        {casino.bonus_info}
                      </div>
                    )}
                  </div>
                  <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 w-full" asChild>
                    <Link href={`/casinos/${casino.id}`}>View Details</Link>
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-4 sm:mt-6 md:mt-8">
            <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
              <Link href="/casinos">View All Casinos</Link>
            </Button>
          </div>
        </section>

        {/* Content Separator */}
        <DataPointsSeparator />

        {/* Featured Bonuses Section */}
        <section>
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">Exclusive Bonuses</h2>
            <p className="text-gray-400 text-lg">Claim the best casino bonuses available only through GuruSingapore</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(homeBonuses?.length ? homeBonuses : featuredBonuses)?.map((bonus: any) => (
              <GlassCard key={bonus.id} className="p-6 hover:border-[#00ff88]/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {bonus.casinos?.logo_url ? (
                      <Image
                        src={bonus.casinos.logo_url || "/placeholder.svg"}
                        alt={`${bonus.casinos.name} logo`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Trophy className="w-8 h-8 text-[#00ff88]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-semibold">
                        {bonus.bonus_type || "BONUS"}
                      </span>
                      {bonus.casinos?.rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-[#00ff88] fill-current" />
                          <span className="text-white text-xs ml-1">{bonus.casinos.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{bonus.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{bonus.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[#00ff88] font-bold">{bonus.bonus_amount}</div>
                        <div className="text-gray-400 text-xs">{bonus.casinos?.name}</div>
                      </div>
                      <Button size="sm" className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                        <Link href={bonus.home_link_override || bonus.claim_url || `/casinos/${bonus.casino_id}`}>Claim Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
              <Link href="/bonuses">View All Bonuses</Link>
            </Button>
          </div>
        </section>

        {/* Content Separator */}
        <ExpertAnalysisSeparator />

        {/* Latest News Section */}
        <section>
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">Latest Industry News</h2>
            <p className="text-gray-400 text-lg">
              Stay updated with the latest casino industry developments and insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {latestNews?.map((article: News) => (
              <GlassCard key={article.id} className="p-6 hover:border-[#00ff88]/30 transition-colors">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-[#00ff88] mr-2" />
                  <span className="text-[#00ff88] text-sm font-semibold">{article.category}</span>
                </div>
                {article.image_url && (
                  <div className="w-full h-40 bg-white/10 rounded-lg mb-4 overflow-hidden">
                    <Image
                      src={article.image_url || "/placeholder.svg"}
                      alt={article.title}
                      width={320}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{article.title}</h3>
                <p className="text-gray-400 mb-4 text-sm line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">{new Date(article.created_at).toLocaleDateString()}</span>
                  <Button variant="ghost" className="text-[#00ff88] p-0 h-auto" asChild>
                    <Link href={`/news/${article.id}`}>Read More</Link>
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
              <Link href="/news">View All News</Link>
            </Button>
          </div>
        </section>

        {/* Content Separator */}
        <TrustedPlatformSeparator />

        {/* Recent Reviews Section */}
        {recentReviews && recentReviews.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Latest Casino Reviews</h2>
              <p className="text-gray-400 text-lg">Read honest reviews from our expert team and community</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {recentReviews.map((review: any) => (
                <GlassCard key={review.id} className="p-6 hover:border-[#00ff88]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {review.casinos?.logo_url ? (
                        <Image
                          src={review.casinos.logo_url || "/placeholder.svg"}
                          alt={`${review.casinos.name} logo`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield className="w-6 h-6 text-[#00ff88]" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">By {review.author_name || "GuruSingapore"}</span>
                    <Button variant="ghost" className="text-[#00ff88] p-0 h-auto" asChild>
                      <Link
                        href={`/reviews/${review.casinos?.name?.toLowerCase().replace(/\s+/g, "-")}-${review.casino_id}`}
                      >
                        Read Review
                      </Link>
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                <Link href="/reviews">View All Reviews</Link>
              </Button>
            </div>
          </section>
        )}

        {/* Trust & Safety Section */}
        <section>
          <GlassCard className="p-12 max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 text-[#00ff88] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Your Safety is Our Priority</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              We thoroughly review every casino, verify licenses, test security measures, and monitor player feedback to
              ensure you only play at trustworthy establishments.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <Award className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-gray-400 text-sm">Casinos Reviewed</div>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-gray-400 text-sm">Safety Monitoring</div>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-gray-400 text-sm">Protected Players</div>
              </div>
            </div>
            <Button size="lg" className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
              <Link href="/reports">Report an Issue</Link>
            </Button>
          </GlassCard>
        </section>

        {/* Logo Slider */}
        <LogoSlider />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Live Stats */}
        <LiveStats />

        {/* How It Works */}
        <HowItWorks />

        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
