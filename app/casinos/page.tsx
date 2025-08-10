import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, MapPin, Gift, ExternalLink, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Casino } from "@/lib/types"

export default async function CasinosPage() {
  const supabase = await createClient()

  const { data: casinos } = await supabase.from("casinos").select("*").order("rating", { ascending: false })

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Online Casinos</h1>
          <p className="text-gray-400 text-lg">Discover the best online casinos with expert reviews and ratings</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {casinos?.map((casino: Casino) => (
            <GlassCard key={casino.id} className="p-6 hover:scale-105 transition-transform duration-300">
              {/* Casino Logo */}
              <div className="mb-6">
                <div className="w-full h-20 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {casino.logo_url ? (
                    <Image
                      src={casino.logo_url || "/placeholder.svg"}
                      alt={`${casino.name} logo`}
                      width={200}
                      height={80}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{casino.name}</span>
                  )}
                </div>
              </div>

              {/* Casino Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{casino.name}</h3>
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-[#00ff88] fill-current" />
                  <span className="text-white ml-1 font-semibold">{casino.rating}</span>
                  <span className="text-gray-400 ml-1 text-sm">/5.0</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-gray-400 text-sm">{casino.description}</p>

                {casino.location && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    {casino.location}
                  </div>
                )}

                {casino.bonus_info && (
                  <div className="flex items-start text-gray-400 text-sm">
                    <Gift className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{casino.bonus_info}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                    <Link href={`/casinos/${casino.id}`}>View Details</Link>
                  </Button>
                  {casino.website_url && (
                    <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                      <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Read Review Button */}
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white bg-transparent hover:bg-white/10"
                  asChild
                >
                  <Link href={`/casinos/${casino.id}/review`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Read Review
                  </Link>
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>

        {!casinos?.length && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No casinos found. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  )
}
