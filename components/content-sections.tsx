"use client"

import { useState, useEffect, useCallback } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Shield, Award, Users, TrendingUp, Clock, Star, Gift, MessageSquare, CheckCircle, DollarSign } from "lucide-react"
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
    <section className="py-2 sm:py-3 md:py-6 lg:py-10 xl:py-16">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Header - Mobile Compact, Desktop Spacious */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
          <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-medium md:font-semibold lg:font-bold text-white mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6">
            Why Choose GuruSingapore?
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto leading-tight sm:leading-normal">
            We&apos;re committed to providing you with the most comprehensive and trustworthy casino information
          </p>
        </div>

        {/* Features Grid - Mobile Compact, Desktop Spacious */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 text-center">
              {/* Icon - Mobile Small, Desktop Large */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-[#00ff88] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6">
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-black" />
              </div>
              
              {/* Title - Mobile Small, Desktop Large */}
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium sm:font-semibold md:font-bold text-white mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4">
                {feature.title}
              </h3>
              
              {/* Description - Mobile Tiny, Desktop Normal */}
              <p className="text-gray-400 text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg leading-tight sm:leading-normal">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LiveStats() {
  const [stats, setStats] = useState({
    casinos: 0,
    bonuses: 0,
    users: 0,
    reviews: 0,
  })
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    const [casinosCount, bonusesCount, reviewsCount] = await Promise.all([
      supabase.from("casinos").select("*", { count: "exact", head: true }),
      supabase.from("bonuses").select("*", { count: "exact", head: true }),
      supabase.from("player_reviews").select("*", { count: "exact", head: true }),
    ])

    setStats({
      casinos: casinosCount.count || 0,
      bonuses: bonusesCount.count || 0,
      users: 1250, // This would come from auth.users in a real app
      reviews: reviewsCount.count || 0,
    })
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const statItems = [
    { label: "Casinos Reviewed", value: stats.casinos, icon: Star },
    { label: "Active Bonuses", value: stats.bonuses, icon: Gift },
    { label: "Members", value: stats.users, icon: Users },
    { label: "Reviews", value: stats.reviews, icon: MessageSquare },
  ]

  return (
    <section className="py-2 sm:py-3 md:py-6 lg:py-10">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile Compact, Desktop Spacious */}
          <div className="text-center mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <h2 className="text-sm sm:text-base md:text-xl lg:text-3xl xl:text-4xl font-medium md:font-semibold lg:font-bold text-white mb-1 sm:mb-1.5 md:mb-2 lg:mb-4">
              Platform Overview
            </h2>
            <p className="text-gray-400 text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg">
              Live statistics from our community
            </p>
          </div>

          {/* Stats Grid - Responsive Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 xl:gap-8">
            {statItems.map((stat, index) => (
              <div key={index} className="text-center p-1.5 sm:p-2 md:p-4 lg:p-6 xl:p-8">
                {/* Icon - Mobile Tiny, Desktop Large */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4">
                  <stat.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-[#00ff88]" />
                </div>
                
                {/* Value - Mobile Small, Desktop Large */}
                <div className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-medium sm:font-semibold md:font-bold text-white mb-0.5 sm:mb-1 md:mb-1 lg:mb-2">
                  {stat.value.toLocaleString()}
                </div>
                
                {/* Label - Mobile Tiny, Desktop Normal */}
                <div className="text-gray-400 text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg font-normal sm:font-medium leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section className="py-2 sm:py-3 md:py-6 lg:py-10 xl:py-16 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 via-transparent to-[#06b6d4]/5" />
      
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 relative z-10">
        {/* Main Statistics Section - Mobile Compact, Desktop Spacious */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16 mb-6 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20">
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center">
            {/* Title - Mobile Small, Desktop Large */}
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-medium sm:font-semibold md:font-bold lg:font-bold text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8">
              Making online gambling fairer and safer
            </h2>
            
            {/* Description - Mobile Compact, Desktop Spacious */}
            <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight sm:leading-normal md:leading-relaxed mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              Many of our efforts revolve around turning online gambling into a fairer 
              and safer activity. This includes reading and evaluating the casinos&apos; Terms 
              and Conditions as part of our casino review process and doing everything 
              we can to persuade casinos to remove or alter unfair or questionable 
              clauses in accordance with our{" "}
              <Link href="/fair-gambling-codex" className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors cursor-pointer">
                Fair gambling codex
              </Link>.
            </p>
            
            {/* Icons - Mobile Small, Desktop Large */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-[#00ff88] rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black" />
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-[#00ff88] rounded-full flex items-center justify-center">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black" />
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-[#00ff88] rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black" />
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-[#00ff88] rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black" />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Statistics */}
          <div className="flex flex-col justify-center items-center lg:items-end">
            <div className="text-center lg:text-right">
              {/* Main Number - Mobile Medium, Desktop Huge */}
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-br from-[#00ff88] to-[#06b6d4] bg-clip-text text-transparent mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                {/* Later */}
              </div>
              
              {/* Label - Mobile Small, Desktop Large */}
              <div className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl font-medium sm:font-semibold md:font-bold text-[#00ff88] mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                {/* Later */}
              </div>
              
              {/* Description - Mobile Tiny, Desktop Normal */}
              <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg leading-tight sm:leading-normal">
                {/* Later */}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function RecentActivity() {
  const [recentCasinos, setRecentCasinos] = useState<any[]>([])
  const [recentNews, setRecentNews] = useState<any[]>([])
  const supabase = createClient()

  const fetchRecentActivity = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    fetchRecentActivity()
  }, [fetchRecentActivity])

  return (
    <section className="py-4 sm:py-6 md:py-10 lg:py-16 xl:py-20">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Header - Mobile Compact, Desktop Spacious */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
          <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-medium sm:font-semibold md:font-bold text-white mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6">Recent Activity</h2>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl mx-auto leading-tight sm:leading-normal">Latest additions and updates to our platform</p>
        </div>

        {/* Activity Grid - Mobile Compact, Desktop Spacious */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Recent Casinos */}
          <GlassCard className="p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center mb-2 sm:mb-3 md:mb-4 lg:mb-5">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#00ff88] mr-1.5 sm:mr-2" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium sm:font-semibold text-white">Recently Added Casinos</h3>
            </div>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {recentCasinos.map((casino, index) => (
                <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 md:p-3 lg:p-4 rounded-md sm:rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg">{casino.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                      {new Date(casino.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-[#00ff88] fill-current mr-1" />
                    <span className="text-white text-xs sm:text-sm md:text-base">{casino.rating}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 sm:mt-3 md:mt-4 lg:mt-5 border-[#00ff88] text-[#00ff88] bg-transparent text-xs sm:text-sm md:text-base"
              asChild
            >
              <Link href="/casinos">View All Casinos</Link>
            </Button>
          </GlassCard>

          {/* Recent News */}
          <GlassCard className="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8">
            <div className="flex items-center mb-2 sm:mb-3 md:mb-4 lg:mb-5">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#00ff88] mr-1.5 sm:mr-2" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium sm:font-semibold text-white">Latest News</h3>
            </div>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {recentNews.map((article, index) => (
                <div key={index} className="p-1.5 sm:p-2 md:p-3 lg:p-4 rounded-md sm:rounded-lg bg-white/5">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="bg-[#00ff88]/20 text-[#00ff88] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm font-medium">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-white font-medium text-xs sm:text-sm md:text-base mb-1">{article.title}</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{new Date(article.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 sm:mt-3 md:mt-4 lg:mt-5 border-[#00ff88] text-[#00ff88] bg-transparent text-xs sm:text-sm md:text-base"
              asChild
            >
              <Link href="/news">Read All News</Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}

// Main ContentSections component that combines all sections
export function ContentSections() {
  return (
    <>
      <WhyChooseUs />
      <LiveStats />
      <HowItWorks />
      <RecentActivity />
    </>
  )
}

// Default export for backward compatibility
export default ContentSections
