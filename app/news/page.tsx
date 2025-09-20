import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { createClient } from "@/lib/supabase/server"
import { Calendar, User, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Input, Button } from "@/components/ui"
import Image from "next/image"
import RealtimeNewsRefresher from "@/components/realtime-news-refresher"
import type { News } from "@/lib/types"

export const metadata = {
  title: "Latest Casino News | GuruSingapore",
  description: "Stay updated with the latest developments in the online gambling industry. Breaking news, regulatory updates, and industry insights from GuruSingapore.",
}

// Revalidate every 30 minutes for news content
export const revalidate = 1800

export default async function NewsPage() {
  const supabase = await createClient()

  const { data: news } = await supabase
    .from("news_articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })

  const categories = [...new Set(news?.map((article) => article.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-black">
      <RealtimeNewsRefresher />
      <DynamicPageHero
        pageName="news"
        sectionType="hero"
        fallbackTitle="Latest Casino News"
        fallbackDescription="Stay updated with the latest developments in the online gambling industry. Breaking news, regulatory updates, and industry insights."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'News', href: '/news' }
        ]}
        author={{ name: "Casino Guru Team" }}
        date="Updated daily"
      />
      <div className="container mx-auto px-4 py-16">

        {/* Trending Topics */}
        {news && news.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Trending Topics</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="bg-gradient-to-r from-[#00ff88]/20 to-[#00ff88]/10 text-[#00ff88] px-4 py-2 rounded-full text-sm font-medium border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors cursor-pointer"
                >
                  #{category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category) => (
              <span
                key={category}
                className="bg-[#00ff88]/20 text-[#00ff88] px-3 py-1 rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Featured Article */}
        {news && news.length > 0 && (
            <GlassCard className="p-5 sm:p-8 mb-8 sm:mb-12 hover:bg-white/10 transition-colors">
              {news[0].featured_image && (
                <div className="w-full h-40 sm:h-56 bg-white/5 rounded-lg overflow-hidden border border-white/10 mb-4 sm:mb-6">
                  <div className="relative w-full h-full">
                    <Image
                      src={news[0].featured_image}
                      alt={news[0].title}
                      fill
                      sizes="(max-width: 640px) 100vw, 768px"
                      className="object-contain bg-black/20"
                      priority
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center mb-3">
                <TrendingUp className="w-5 h-5 text-[#00ff88] mr-2" />
                <span className="text-[#00ff88] text-sm font-medium">Featured</span>
                {news[0].category && (
                  <>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-400 text-sm">{news[0].category}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                <Link href={`/news/${news[0].id}`} className="hover:text-[#00ff88] transition-colors">
                  {news[0].title}
                </Link>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg mb-4 sm:mb-6">
                {news[0].excerpt || (news[0].content?.length > 200 ? `${news[0].content.substring(0, 200)}...` : news[0].content)}
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date(news[0].created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <User className="w-4 h-4 mr-1" />
                <span>Casino Guide Team</span>
              </div>
            </GlassCard>
          )}

          {/* News Grid */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {news?.slice(1).map((article: News) => (
              <GlassCard key={article.id} className="p-4 sm:p-6 hover:bg-white/10 transition-colors">
                {article.featured_image && (
                  <div className="w-full h-32 sm:h-40 bg-white/5 rounded-lg overflow-hidden border border-white/10 mb-3">
                    <div className="relative w-full h-full">
                      <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-contain bg-black/20"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center mb-3">
                  {article.category && (
                    <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-medium">
                      {article.category}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
                  <Link href={`/news/${article.id}`} className="hover:text-[#00ff88] transition-colors">
                    {article.title}
                  </Link>
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-3">
                  {article.excerpt || (article.content ? (article.content.length > 160 ? `${article.content.substring(0, 160)}...` : article.content) : '')}
                </p>
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <User className="w-4 h-4 mr-1" />
                  <span>Casino Guide Team</span>
                </div>
              </GlassCard>
            ))}
          </div>

          {!news?.length && (
            <div className="text-center py-16">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No news articles available at the moment. Check back later!</p>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <GlassCard className="p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Get the latest casino news and exclusive insights delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                placeholder="Enter your email"
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
              <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">Subscribe</Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
