import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink, Star, Users, Calendar, Clock, Shield, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ContentSections } from "@/components/content-sections"

interface CasinoPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CasinoPage({ params }: CasinoPageProps) {
  const { id } = await params
  const supabase = createClient()

  const supabaseClient = await supabase
  const { data: casino, error } = await supabaseClient.from("casinos").select("*").eq("id", id).single()

  if (error || !casino) {
    notFound()
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-500"
    if (rating >= 4.0) return "text-blue-500"
    if (rating >= 3.5) return "text-yellow-500"
    if (rating >= 3.0) return "text-orange-500"
    return "text-red-500"
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent"
    if (rating >= 4.0) return "Very Good"
    if (rating >= 3.5) return "Good"
    if (rating >= 3.0) return "Fair"
    return "Poor"
  }

  // Generate JSON-LD structured data for casino detail
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/#organization`,
        "name": "GuruSingapore",
        "url": process.env.NEXT_PUBLIC_SITE_URL,
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        "description": "Expert casino reviews and gambling guides for Singapore players"
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
            "name": "Casinos",
            "item": `${process.env.NEXT_PUBLIC_SITE_URL}/casinos`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": casino.name,
            "item": `${process.env.NEXT_PUBLIC_SITE_URL}/casinos/${casino.id}`
          }
        ]
      },
      {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL}/casinos/${casino.id}`,
        "name": casino.name,
        "url": casino.website_url,
        "description": casino.description,
        "logo": casino.logo_url,
        "aggregateRating": casino.rating ? {
          "@type": "AggregateRating",
          "ratingValue": casino.rating,
          "bestRating": 10,
          "worstRating": 1,
          "ratingCount": casino.player_rating_count || 1
        } : undefined,
        "review": {
          "@type": "Review",
          "author": {
            "@type": "Organization",
            "name": "GuruSingapore"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": casino.rating,
            "bestRating": 10,
            "worstRating": 1
          },
          "reviewBody": casino.description
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black pt-28">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/casinos"
          className="inline-flex items-center gap-2 text-[#00ff88] hover:text-[#00cc6a] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Casinos
        </Link>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/casinos" className="hover:text-white transition-colors">
            Casinos
          </Link>
          <span>/</span>
          <span className="text-white">{casino.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Casino Header */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <Image
                  src={casino.logo_url || "/placeholder-logo.png"}
                  alt={`${casino.name} logo`}
                  width={120}
                  height={120}
                  className="rounded-xl border border-gray-700"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-4">{casino.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 ${getRatingColor(casino.rating)}`} />
                    <span className={`font-semibold ${getRatingColor(casino.rating)}`}>{casino.rating}/10</span>
                    <span className="text-gray-400">- {getRatingLabel(casino.rating)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Users className="w-4 h-4" />
                    <span>{casino.player_rating_count || 0} Reviews</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">{casino.description}</p>
                <div className="flex flex-wrap gap-3">
                  {(casino.affiliate_url || casino.website_url) && (
                    <Button
                      className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold"
                      asChild
                    >
                      <Link href={(casino.affiliate_url || casino.website_url) as string} target="_blank" rel="noopener noreferrer">
                        Visit Casino
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black bg-transparent"
                    asChild
                  >
                    <Link href={`/expert-reviews/${casino.id}-${casino.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      Expert Review
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    asChild
                  >
                    <Link href={`/reviews/${casino.id}-${casino.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      Player Reviews
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <ContentSections />
          </div>

          {/* Sidebar - Quick Overview */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 sticky top-32">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#00ff88]" />
                  Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Safety Rating
                  </span>
                  <span className={`font-semibold ${getRatingColor(casino.rating)}`}>{casino.rating}/10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Player Rating
                  </span>
                  <span className="text-yellow-500 font-semibold">{(casino.player_rating_avg ?? 0).toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Est. Year
                  </span>
                  <span className="text-white font-semibold">N/A</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Support
                  </span>
                  <Badge variant="secondary" className="bg-[#00ff88]/20 text-[#00ff88]">
                    24/7
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
