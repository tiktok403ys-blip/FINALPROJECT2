import { HeroBanner } from "@/components/hero-banner"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, TrendingUp, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { LogoSlider } from "@/components/logo-slider"
import { WhyChooseUs, LiveStats, HowItWorks, RecentActivity } from "@/components/content-sections"
import type { Casino, News, LeaderboardEntry } from "@/lib/types"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch top casinos
  const { data: topCasinos } = await supabase.from("casinos").select("*").order("rating", { ascending: false }).limit(3)

  // Fetch latest news
  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch leaderboard preview
  const { data: leaderboardPreview } = await supabase
    .from("leaderboard")
    .select("*, casinos(name)")
    .order("rank", { ascending: true })
    .limit(5)

  return (
    <div className="min-h-screen bg-black">
      <HeroBanner />

      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Top Casinos Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Top Rated Casinos</h2>
            <p className="text-gray-400 text-lg">Discover our highest-rated online casinos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {topCasinos?.map((casino: Casino) => (
              <GlassCard key={casino.id} className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{casino.name}</h3>
                  <p className="text-gray-400 mb-4">{casino.description}</p>
                  <div className="flex items-center justify-center mb-4">
                    <Star className="w-5 h-5 text-[#00ff88] fill-current" />
                    <span className="text-white ml-1">{casino.rating}</span>
                  </div>
                  <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                    <Link href={`/casinos/${casino.id}`}>View Details</Link>
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
              <Link href="/casinos">View All Casinos</Link>
            </Button>
          </div>
        </section>

        {/* Latest News Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Latest News</h2>
            <p className="text-gray-400 text-lg">Stay updated with the latest casino industry news</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {latestNews?.map((article: News) => (
              <GlassCard key={article.id} className="p-6">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-[#00ff88] mr-2" />
                  <span className="text-[#00ff88] text-sm">{article.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{article.title}</h3>
                <p className="text-gray-400 mb-4">{article.excerpt}</p>
                <Button variant="ghost" className="text-[#00ff88] p-0" asChild>
                  <Link href={`/news/${article.id}`}>Read More →</Link>
                </Button>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
              <Link href="/news">View All News</Link>
            </Button>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Top Players</h2>
            <p className="text-gray-400 text-lg">See who's leading the rankings</p>
          </div>

          <GlassCard className="p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              {leaderboardPreview?.map((entry: LeaderboardEntry & { casinos?: { name: string } }, index) => (
                <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                            ? "bg-gray-400"
                            : index === 2
                              ? "bg-orange-500"
                              : "bg-[#00ff88]"
                      }`}
                    >
                      {index < 3 ? (
                        <Trophy className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white text-sm">{entry.rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{entry.player_name}</p>
                      <p className="text-gray-400 text-sm">{entry.casinos?.name}</p>
                    </div>
                  </div>
                  <div className="text-[#00ff88] font-bold">{entry.points} pts</div>
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                <Link href="/leaderboard">View Full Leaderboard</Link>
              </Button>
            </div>
          </GlassCard>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <GlassCard className="p-12 max-w-3xl mx-auto">
            <Users className="w-16 h-16 text-[#00ff88] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
            <p className="text-gray-400 text-lg mb-8">
              Connect with fellow players, share experiences, and get expert advice in our forum
            </p>
            <Button size="lg" className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
              <Link href="/forum">Join Forum</Link>
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
