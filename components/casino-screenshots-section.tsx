"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CasinoScreenshots } from "@/components/casino-screenshots"
import { Eye, Image as ImageIcon } from "lucide-react"

interface CasinoScreenshot {
  id: string
  image_url: string
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_featured: boolean
  created_at: string
}

interface CasinoScreenshotsSectionProps {
  casinoId: string
}

export function CasinoScreenshotsSection({ casinoId }: CasinoScreenshotsSectionProps) {
  const [screenshots, setScreenshots] = useState<CasinoScreenshot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("casino_screenshots")
          .select("*")
          .eq("casino_id", casinoId)
          .order("display_order", { ascending: true })
          .order("is_featured", { ascending: false })

        if (error) throw error
        setScreenshots(data || [])
      } catch (error) {
        console.error("Error fetching screenshots:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScreenshots()
  }, [casinoId, supabase])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading screenshots...</p>
      </div>
    )
  }

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No screenshots available for this casino yet</p>
        <p className="text-gray-500 text-sm mt-2">Check back later for visual content</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Screenshots Overview */}
      <div className="text-center mb-6">
        <p className="text-gray-300 mb-4">
          Explore {casinoId ? "this casino" : "the casino"} through our detailed screenshots and visual content
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {screenshots.length} Screenshots
          </span>
          {screenshots.filter(s => s.is_featured).length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              {screenshots.filter(s => s.is_featured).length} Featured
            </span>
          )}
        </div>
      </div>

      {/* Screenshots Component */}
      <CasinoScreenshots screenshots={screenshots} />

      {/* Categories Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {Array.from(new Set(screenshots.map(s => s.category).filter(Boolean))).map((category) => (
          <div key={category} className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[#00ff88] font-semibold text-sm capitalize">
              {category}
            </div>
            <div className="text-gray-400 text-xs">
              {screenshots.filter(s => s.category === category).length} images
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
