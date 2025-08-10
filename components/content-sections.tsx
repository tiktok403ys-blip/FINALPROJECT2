"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Shield, Award, Users, TrendingUp, Clock, Star, Gift, MessageSquare } from "lucide-react"
import Link from "next/link"

export function WhyChooseUs() {
  const features = [
    {
      icon: Shield,
      title: "Trusted Reviews",
      description: "Honest, unbiased reviews from real players and industry experts",
    },
    {
      icon: Award,
      title: "Exclusive Bonuses",
      description: "Access to special promotions and bonuses not available elsewhere",
    },
    {
      icon: Users,
      title: "Active Community",
      description: "Join thousands of players sharing tips, strategies, and experiences",
    },
    {
      icon: TrendingUp,
      title: "Latest Updates",
      description: "Stay informed with the newest casino launches and industry news",
    },
  ]

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Why Choose Casino Guide?</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          We're committed to providing you with the most comprehensive and trustworthy casino information
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <GlassCard key={index} className="p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <feature.icon className="w-8 h-8 text-[#00ff88]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}

export function LiveStats() {
  const [stats, setStats] = useState({
    casinos: 0,
    bonuses: 0,
    users: 0,
    posts: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const [casinosCount, bonusesCount, postsCount] = await Promise.all([
      supabase.from("casinos").select("*", { count: "exact", head: true }),
      supabase.from("bonuses").select("*", { count: "exact", head: true }),
      supabase.from("forum_posts").select("*", { count: "exact", head: true }),
    ])

    setStats({
      casinos: casinosCount.count || 0,
      bonuses: bonusesCount.count || 0,
      users: 1250, // This would come from auth.users in a real app
      posts: postsCount.count || 0,
    })
  }

  const statItems = [
    { label: "Reviewed Casinos", value: stats.casinos, icon: Star },
    { label: "Active Bonuses", value: stats.bonuses, icon: Gift },
    { label: "Community Members", value: stats.users, icon: Users },
    { label: "Forum Posts", value: stats.posts, icon: MessageSquare },
  ]

  return (
    <section className="py-16">
      <GlassCard className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Live Platform Statistics</h2>
          <p className="text-gray-400">Real-time data from our growing community</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {statItems.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-[#00ff88]" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Browse Casinos",
      description: "Explore our comprehensive database of reviewed online casinos",
      icon: Star,
    },
    {
      step: "2",
      title: "Read Reviews",
      description: "Check detailed reviews, ratings, and player feedback",
      icon: MessageSquare,
    },
    {
      step: "3",
      title: "Claim Bonuses",
      description: "Access exclusive bonuses and promotions",
      icon: Gift,
    },
    {
      step: "4",
      title: "Join Community",
      description: "Connect with other players and share experiences",
      icon: Users,
    },
  ]

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-gray-400 text-lg">Get started in just a few simple steps</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="text-center relative">
            <GlassCard className="p-6 hover:bg-white/10 transition-colors">
              <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                {step.step}
              </div>
              <step.icon className="w-8 h-8 text-[#00ff88] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </GlassCard>
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#00ff88]/30 transform -translate-y-1/2" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function RecentActivity() {
  const [recentCasinos, setRecentCasinos] = useState<any[]>([])
  const [recentNews, setRecentNews] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    const [casinos, news] = await Promise.all([
      supabase.from("casinos").select("name, rating, created_at").order("created_at", { ascending: false }).limit(3),
      supabase
        .from("news")
        .select("title, category, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3),
    ])

    if (casinos.data) setRecentCasinos(casinos.data)
    if (news.data) setRecentNews(news.data)
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Recent Activity</h2>
        <p className="text-gray-400 text-lg">Latest additions and updates to our platform</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Casinos */}
        <GlassCard className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-[#00ff88] mr-2" />
            <h3 className="text-lg font-semibold text-white">Recently Added Casinos</h3>
          </div>
          <div className="space-y-3">
            {recentCasinos.map((casino, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{casino.name}</p>
                  <p className="text-gray-400 text-sm">{new Date(casino.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-[#00ff88] fill-current mr-1" />
                  <span className="text-white text-sm">{casino.rating}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
            <Link href="/casinos">View All Casinos</Link>
          </Button>
        </GlassCard>

        {/* Recent News */}
        <GlassCard className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-[#00ff88] mr-2" />
            <h3 className="text-lg font-semibold text-white">Latest News</h3>
          </div>
          <div className="space-y-3">
            {recentNews.map((article, index) => (
              <div key={index} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-medium">
                    {article.category}
                  </span>
                </div>
                <p className="text-white font-medium text-sm mb-1">{article.title}</p>
                <p className="text-gray-400 text-xs">{new Date(article.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
            <Link href="/news">Read All News</Link>
          </Button>
        </GlassCard>
      </div>
    </section>
  )
}
