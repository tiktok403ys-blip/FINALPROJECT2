"use client"

import { useState, useEffect } from "react"
import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import {
  Gift,
  Star,
  Zap,
  ChevronDown,
  Play,
  CreditCard,
  DollarSign,
  Calendar,
  Gauge,
  FileText,
  MessageCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import { BonusFeedback } from "@/components/bonuses/bonus-feedback"
import { useToast } from "@/hooks/use-toast"
import type { Bonus, Casino } from "@/lib/types"
import { ErrorBoundary } from "@/components/error-boundary"

export default function BonusesClientPage({ bonuses: initialBonuses }: { bonuses: (Bonus & { casinos?: Casino; has_review?: boolean })[] }) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})
  const [bonuses, setBonuses] = useState(initialBonuses)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { success, error } = useToast()
  const ITEMS_PER_PAGE = 10

  const toggleSection = (bonusId: string, sectionKey: string) => {
    const key = `${bonusId}-${sectionKey}`
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isExpanded = (bonusId: string, sectionKey: string) => {
    const key = `${bonusId}-${sectionKey}`
    return expandedSections[key] || false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getBonusTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "welcome":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "no deposit":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "free spins":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "reload":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30"
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const copyPromoCode = async (promoCode: string) => {
    try {
      await navigator.clipboard.writeText(promoCode)
      success("Copied", "Promo code copied to clipboard.")
    } catch (err) {
      error("Copy failed", "Could not copy. Please try manually.")
    }
  }

  const loadMoreBonuses = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const nextPage = currentPage + 1
      const response = await fetch(`/api/bonuses?page=${nextPage}&limit=${ITEMS_PER_PAGE}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bonuses')
      }
      
      const data = await response.json()
      
      if (data.bonuses && data.bonuses.length > 0) {
        setBonuses(prev => [...prev, ...data.bonuses])
        setCurrentPage(nextPage)
        setHasMore(data.pagination.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more bonuses:', err)
      error("Load Failed", "Could not load more bonuses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Initialize hasMore based on initial data length
  useEffect(() => {
    setHasMore(initialBonuses.length >= ITEMS_PER_PAGE)
  }, [initialBonuses.length, ITEMS_PER_PAGE])

  // Update filtered bonuses when bonuses change
  // (Filter removed) nothing to sync here

  // Hydration guard to prevent SSR/Client mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // (Filter removed) handleFilterChange no longer needed

  return (
    <div className="min-h-screen bg-black">
      <DynamicPageHero
        pageName="bonuses"
        sectionType="hero"
        fallbackTitle="Best Casino Bonuses for December 2025 - Exclusive Offers"
        fallbackDescription="Discover the most generous casino bonuses and exclusive promotional offers available this month. Our team verifies every bonus to ensure you get the best value and fair terms. From welcome bonuses to free spins, find the perfect offer for your gaming style."
        breadcrumbs={[{ label: "Best Casino Bonuses" }]}
        author={{ name: "GuruSingapore Bonus Team" }}
        date="10 Dec 2025"
      />

      <div className="container mx-auto px-4 py-10 md:py-16">

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-white/70 text-sm">
            Showing {(Array.isArray(bonuses) ? bonuses.length : 0)} bonuses
          </p>
        </div>

        {/* Bonuses List */}
        {mounted && (
          <ErrorBoundary>
            <div className="space-y-6">
          {(Array.isArray(bonuses) ? bonuses.filter((b) => b && typeof (b as any).id === 'string') : []).map((bonus: Bonus & { casinos?: Casino; has_review?: boolean }, index: number) => {
            const typeColor = getBonusTypeColor(bonus.bonus_type || "")
            const expiringSoon = bonus.expiry_date ? isExpiringSoon(bonus.expiry_date) : false
            const expired = bonus.expiry_date ? isExpired(bonus.expiry_date) : false

            return (
              <GlassCard
                key={bonus.id}
                className={`hover:shadow-xl transition-all duration-300 border bonus-card-glass cv-auto ${
                  expired
                    ? "border-red-500/30 opacity-60"
                    : expiringSoon
                      ? "border-yellow-500/30"
                      : "border-white/10 hover:border-[#00ff88]/30"
                }`}
                style={{
                  '--dynamic-bg-color': (bonus as any).card_bg_color || bonus.casinos?.placeholder_bg_color || '#1f2937',
                  '--dynamic-gradient-start': (bonus as any).card_bg_color
                    ? `${(bonus as any).card_bg_color}20`
                    : bonus.casinos?.placeholder_bg_color
                      ? `${bonus.casinos.placeholder_bg_color}15`
                      : 'rgba(255, 255, 255, 0.05)',
                  '--dynamic-gradient-end': (bonus as any).card_bg_color
                    ? `${(bonus as any).card_bg_color}10`
                    : bonus.casinos?.placeholder_bg_color
                      ? `${bonus.casinos.placeholder_bg_color}08`
                      : 'rgba(255, 255, 255, 0.03)'
                } as React.CSSProperties}
              >
                <div className="flex flex-col lg:flex-row min-h-[260px] lg:min-h-[300px] min-w-0 bonus-card-optimized">
                  {/* Left Side - Bonus Details */}
                  <div
                    className="lg:w-2/3 p-4 sm:p-5 lg:p-6 bonus-card-left min-w-0"
                    style={{
                      '--dynamic-bg-color': (bonus as any).card_bg_color || bonus.casinos?.placeholder_bg_color || '#1f2937'
                    } as React.CSSProperties}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {(bonus.bonus_type?.toUpperCase() || (bonus.is_no_deposit ? "NO DEPOSIT BONUS" : "BONUS"))}
                        </div>
                        {bonus.is_exclusive && (
                          <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">Exclusive</div>
                        )}
                      </div>
                    </div>

                    {/* Main Bonus Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-6 line-clamp-2">
                      {bonus.bonus_amount} {bonus.title}
                    </h2>

                    {/* Expandable Details */}
                    <div className="space-y-3">
                      {/* Play Now Info */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "playNow")}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <Play className="w-4 h-4 text-[#00ff88]" />
                            <span className="text-white font-medium">Play now, deposit later.</span>
                            {bonus.is_no_deposit && (
                              <span className="text-gray-400 text-sm">No deposit bonus for new players</span>
                            )}
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "playNow") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "playNow") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.play_now_text || (
                              <>This is a no deposit bonus, meaning you can claim it without making any initial deposit. Perfect for new players who want to try the casino risk-free.</>
                            )}
                          </div>
                        )}
                      </div>

                      

                      {/* Wagering Requirements */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "wagering")}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <Gauge className="w-4 h-4 text-[#00ff88]" />
                             <span className="text-white font-medium">Wagering requirements:</span>
                             <span className="text-[#00ff88] font-semibold">{(bonus as any).wagering_x || bonus.wagering_x || 25}x</span>
                            <span className="text-blue-400 text-sm">(restrictions apply)</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "wagering") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "wagering") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {(bonus as any).wagering_text || (
                              <>You need to wager the bonus amount {(bonus as any).wagering_x || bonus.wagering_x || 25} times before you can withdraw any winnings. Some games may contribute differently to the wagering requirements.</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Value of Bonus */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "value")}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <DollarSign className="w-4 h-4 text-[#00ff88]" />
                             <span className="text-white font-medium">Value of free spins:</span>
                             <span className="text-[#00ff88] font-semibold">${Number((bonus.free_spins ?? 0) * (bonus.free_spin_value ?? 0)).toFixed(0)}</span>
                             <span className="text-gray-400 text-sm">({bonus.free_spins ?? 0} spins at ${bonus.free_spin_value ?? 0} per spin)</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "value") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "value") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.value_text || (
                              <>Each free spin is worth ${bonus.free_spin_value ?? 0}, giving you a total bonus value of ${Number((bonus.free_spins ?? 0) * (bonus.free_spin_value ?? 0)).toFixed(0)}. Free spins are usually valid on specific slot games only.</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Maximum Bet */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "maxBet")}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <CreditCard className="w-4 h-4 text-[#00ff88]" />
                             <span className="text-white font-medium">Maximum bet:</span>
                             <span className="text-[#00ff88] font-semibold">${bonus.max_bet ?? 0}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "maxBet") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "maxBet") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.max_bet_text || (
                              <>While using bonus funds, your maximum bet per spin/hand is limited to ${bonus.max_bet ?? 0}. Exceeding this limit may void your bonus and winnings.</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bonus Expiration */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "expiration")}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <Calendar className="w-4 h-4 text-[#00ff88]" />
                             <span className="text-white font-medium">Bonus expiration:</span>
                             <span className="text-[#00ff88] font-semibold">{bonus.expiry_days ?? 0} days</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "expiration") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "expiration") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.expiry_text || (
                              <>You have {bonus.expiry_days ?? 0} days from the time you claim this bonus to use it and meet the wagering requirements. After this period, the bonus will expire.</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Process Speed */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "speed")}
                        >
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-[#00ff88]" aria-hidden="true" />
                            <span className="text-white font-medium">
                              <span className="inline sm:hidden">Getting this bonus is</span>
                              <span className="hidden sm:inline">The process of getting this bonus should be relatively</span>
                            </span>
                            <span className="text-[#00ff88] font-semibold">{(bonus as any).claiming_speed || 'FAST'}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "speed") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "speed") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.how_to_get || "This bonus is typically credited to your account within minutes of claiming. No lengthy verification process required for new players."}
                          </div>
                        )}
                      </div>

                      {/* Terms and Conditions */}
                      <div className="border border-white/10 rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleSection(bonus.id, "terms")}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[#00ff88]" />
                            <span className="text-white font-medium">Terms and conditions</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded(bonus.id, "terms") ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isExpanded(bonus.id, "terms") && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {bonus.terms ? (
                              <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm">{bonus.terms}</pre>
                            ) : (
                              <ul className="space-y-1">
                                <li>• Bonus valid for new players only</li>
                                <li>• One bonus per household/IP address</li>
                                <li>• Wagering must be completed within 2 days</li>
                                <li>• Maximum withdrawal from bonus winnings: $100</li>
                                <li>• Full terms available on casino website</li>
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Casino Info & Actions */}
                  <div
                    className="lg:w-1/3 p-4 sm:p-5 lg:p-6 flex flex-col bonus-card-separator min-w-0"
                  >
                    {/* Casino Logo - Colored Area */}
                    <div
                      className="rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-center min-h-[64px] sm:min-h-[80px] flex items-center justify-center bonus-card-logo"
                      style={{
                        '--dynamic-bg-color': (bonus as any).card_bg_color || bonus.casinos?.placeholder_bg_color || '#000000'
                      } as React.CSSProperties}
                    >
                      {bonus.casinos?.logo_url ? (
                        <Image
                          src={bonus.casinos.logo_url || "/placeholder.svg"}
                          alt={`${bonus.casinos.name} logo`}
                          width={160}
                          height={60}
                          sizes="(max-width: 640px) 120px, 160px"
                          className="max-w-full max-h-12 sm:max-h-16 object-contain mx-auto filter brightness-110"
                        />
                      ) : (
                        <div className="text-white font-bold text-xl">
                          {bonus.casinos?.name?.charAt(0) || "B"}
                        </div>
                                              )}
                      </div>

                    {/* Safety Index - Neutral Section */}
                    <div className="mb-6 text-center" style={{ backgroundColor: 'transparent' }}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-gray-400 text-sm">SAFETY INDEX:</span>
                        <Info className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[#00ff88] font-bold text-lg">{bonus.casinos?.rating || "8.8"}+</span>
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">HIGH</span>
                      </div>
                    </div>

                    {/* How to Get Bonus - Neutral Section */}
                    <div className="border border-white/20 rounded-lg p-4 mb-6" style={{ backgroundColor: 'transparent' }}>
                      <h4 className="text-white font-semibold text-center mb-3">HOW TO GET BONUS?</h4>
                      <div className="text-center mb-3">
                        <div className="bg-white/10 rounded px-3 py-2 flex items-center justify-between">
                          <span className="text-[#00ff88] font-bold">{bonus.promo_code || "GURU2000"}</span>
                          <button
                            type="button"
                            onClick={() => copyPromoCode(bonus.promo_code || "GURU2000")}
                            className="p-3 rounded-lg hover:bg-[#00ff88]/10 hover:scale-105 transition-all duration-200 group min-w-[48px] min-h-[48px] flex items-center justify-center"
                            aria-label="Copy promo code"
                          >
                            <Copy className="w-5 h-5 text-gray-400 group-hover:text-[#00ff88] transition-colors duration-200" />
                          </button>
                        </div>
                      </div>
                      <div className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="text-blue-400 text-sm hover:underline">
                              Show step by step instruction
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-black border-white/10 text-white max-w-md">
                            <DialogHeader>
                              <DialogTitle>How to get this bonus</DialogTitle>
                              <DialogDescription>Follow these steps to claim your bonus.</DialogDescription>
                            </DialogHeader>
                            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                              <li>Copy the promotion code.</li>
                              <li>Tap “Get Bonus” to go to the casino.</li>
                              <li>Contact live chat / customer support and provide the code.</li>
                            </ol>
                            <div className="mt-4 p-3 border border-yellow-500/30 rounded-lg bg-yellow-500/10 text-yellow-300 text-xs flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p>Warning: Beware of scams and offers promising unusually large bonuses. Only use codes and links shown on this site. We will never ask for your password or any payment to claim a bonus.</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Casino Review Link - Neutral Section */}
                    <div className="mb-6" style={{ backgroundColor: 'transparent' }}>
                      {bonus.has_review ? (
                        <Link
                          href={`/casinos/${bonus.casino_id}/review`}
                          className="text-purple-400 text-sm hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          Read {bonus.casinos?.name} Casino review
                        </Link>
                      ) : (
                        <Link
                          href={`/casinos/${bonus.casino_id}`}
                          className="text-purple-400 text-sm hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          Visit {bonus.casinos?.name}
                        </Link>
                      )}
                    </div>

                    {/* Action Buttons - Neutral Section */}
                    <div className="space-y-3 mt-auto" style={{ backgroundColor: 'transparent' }}>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        asChild
                        disabled={expired}
                      >
                        <Link href={bonus.claim_url || `/casinos/${bonus.casino_id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Get Bonus
                        </Link>
                      </Button>

                      {/* Feedback */}
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Has bonus worked for you?</p>
                        <BonusFeedback bonusId={bonus.id} yes={bonus.yes_count as any} no={bonus.no_count as any} />
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
            </div>
          </ErrorBoundary>
        )}

        {mounted && !(Array.isArray(bonuses) && bonuses.length) && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Bonuses Available</h3>
            <p className="text-gray-400 text-lg">We&apos;re working on adding exclusive bonus offers for you.</p>
          </div>
        )}

        {/* Load More Button */}
        {mounted && (Array.isArray(bonuses) && bonuses.length > 0) && hasMore && (
          <div className="text-center mt-12 mb-8">
            <Button
              onClick={loadMoreBonuses}
              disabled={loading}
              className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-semibold px-8 py-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading More...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  Load More Bonuses
                </>
              )}
            </Button>
          </div>
        )}

        {/* End of Results Message */}
        {mounted && (Array.isArray(bonuses) && bonuses.length > 0) && !hasMore && !loading && (
          <div className="text-center mt-12 mb-8">
            <div className="inline-flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-lg">
              <Star className="w-5 h-5 mr-2 text-[#00ff88]" />
              <span className="text-white font-medium">You&apos;ve seen all available bonuses!</span>
            </div>
          </div>
        )}

        {/* Bonus Tips */}
        <div className="mt-16">
          <GlassCard className="p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Bonus Tips & Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-[#00ff88] font-semibold mb-3">What to Look For:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Low wagering requirements (under 35x)</li>
                  <li>• Reasonable time limits</li>
                  <li>• Game contribution rates</li>
                  <li>• Maximum bet limits</li>
                  <li>• Withdrawal restrictions</li>
                </ul>
              </div>
              <div>
                <h4 className="text-red-400 font-semibold mb-3">Red Flags:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Extremely high wagering (over 50x)</li>
                  <li>• Very short expiry times</li>
                  <li>• Restricted game selection</li>
                  <li>• Hidden terms and conditions</li>
                  <li>• No customer support</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
              <p className="text-gray-300 text-center">
                <strong className="text-[#00ff88]">Remember:</strong> Always read the terms and conditions before
                claiming any bonus. Gamble responsibly and only with money you can afford to lose.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}
