"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Upload, Trash2, Plus, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface CasinoScreenshot {
  id: string
  image_url: string
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_featured: boolean
}

interface CasinoBanner {
  id: string
  image_url: string
  title: string
  subtitle: string | null
  is_primary: boolean
  display_order: number
}

interface ManageScreenshotsPageProps {
  params: Promise<{ id: string }>
}

export default function ManageScreenshotsPage({ params }: ManageScreenshotsPageProps) {
  const [casinoId, setCasinoId] = useState<string>("")
  const [casinoName, setCasinoName] = useState<string>("")
  const [screenshots, setScreenshots] = useState<CasinoScreenshot[]>([])
  const [banners, setBanners] = useState<CasinoBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [newScreenshot, setNewScreenshot] = useState({
    image_url: "",
    title: "",
    description: "",
    category: "lobby",
    is_featured: false,
  })

  const [newBanner, setNewBanner] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    is_primary: false,
  })

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCasinoId(resolvedParams.id)
      fetchData(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchData = async (id: string) => {
    setLoading(true)

    // Fetch casino info
    const { data: casino } = await supabase.from("casinos").select("name").eq("id", id).single()
    if (casino) setCasinoName(casino.name)

    // Fetch screenshots
    const { data: screenshotsData } = await supabase
      .from("casino_screenshots")
      .select("*")
      .eq("casino_id", id)
      .order("display_order", { ascending: true })

    if (screenshotsData) setScreenshots(screenshotsData)

    // Fetch banners
    const { data: bannersData } = await supabase
      .from("casino_banners")
      .select("*")
      .eq("casino_id", id)
      .order("display_order", { ascending: true })

    if (bannersData) setBanners(bannersData)

    setLoading(false)
  }

  const addScreenshot = async () => {
    if (!newScreenshot.image_url || !newScreenshot.title) {
      setError("URL gambar dan judul harus diisi")
      return
    }

    const { error } = await supabase.from("casino_screenshots").insert({
      casino_id: casinoId,
      ...newScreenshot,
      display_order: screenshots.length + 1,
    })

    if (error) {
      setError(error.message)
    } else {
      setNewScreenshot({
        image_url: "",
        title: "",
        description: "",
        category: "lobby",
        is_featured: false,
      })
      fetchData(casinoId)
    }
  }

  const addBanner = async () => {
    if (!newBanner.image_url || !newBanner.title) {
      setError("URL gambar dan judul harus diisi")
      return
    }

    const { error } = await supabase.from("casino_banners").insert({
      casino_id: casinoId,
      ...newBanner,
      display_order: banners.length + 1,
    })

    if (error) {
      setError(error.message)
    } else {
      setNewBanner({
        image_url: "",
        title: "",
        subtitle: "",
        is_primary: false,
      })
      fetchData(casinoId)
    }
  }

  const deleteScreenshot = async (id: string) => {
    if (confirm("Yakin ingin menghapus screenshot ini?")) {
      const { error } = await supabase.from("casino_screenshots").delete().eq("id", id)
      if (!error) fetchData(casinoId)
    }
  }

  const deleteBanner = async (id: string) => {
    if (confirm("Yakin ingin menghapus banner ini?")) {
      const { error } = await supabase.from("casino_banners").delete().eq("id", id)
      if (!error) fetchData(casinoId)
    }
  }

  const generateImageUrl = (type: "screenshot" | "banner", category?: string) => {
    const name = casinoName.replace(/\s+/g, "+")
    const colors = [
      { bg: "1a1a2e", color: "00ff88" },
      { bg: "2c3e50", color: "ecf0f1" },
      { bg: "8e44ad", color: "ffffff" },
      { bg: "27ae60", color: "ffffff" },
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    if (type === "banner") {
      return `/placeholder.svg?height=400&width=1200&text=${name}+Casino+Banner&bg=${randomColor.bg}&color=${randomColor.color}`
    } else {
      const categoryText = category ? `+${category.charAt(0).toUpperCase() + category.slice(1)}` : ""
      return `/placeholder.svg?height=600&width=800&text=${name}${categoryText}&bg=${randomColor.bg}&color=${randomColor.color}`
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-gray-400">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="text-white mr-4">
            <Link href="/admin/casinos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Casino
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Kelola Media</h1>
            <p className="text-gray-400">{casinoName} - Screenshots & Banners</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Banners Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Banner Casino</h2>

            {/* Add New Banner */}
            <GlassCard className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tambah Banner Baru</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="URL Gambar Banner"
                    value={newBanner.image_url}
                    onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#00ff88] text-[#00ff88] bg-transparent"
                    onClick={() => setNewBanner({ ...newBanner, image_url: generateImageUrl("banner") })}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Judul Banner"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Subtitle (opsional)"
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="banner-primary"
                    checked={newBanner.is_primary}
                    onChange={(e) => setNewBanner({ ...newBanner, is_primary: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="banner-primary" className="text-white text-sm">
                    Banner Utama
                  </label>
                </div>
                <Button onClick={addBanner} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Banner
                </Button>
              </div>
            </GlassCard>

            {/* Existing Banners */}
            <div className="space-y-4">
              {banners.map((banner) => (
                <GlassCard key={banner.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-12 relative rounded overflow-hidden">
                      <Image
                        src={banner.image_url || "/placeholder.svg"}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{banner.title}</h4>
                      {banner.subtitle && <p className="text-gray-400 text-sm">{banner.subtitle}</p>}
                      {banner.is_primary && (
                        <span className="inline-block bg-[#00ff88] text-black text-xs px-2 py-1 rounded mt-1">
                          Primary
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                      onClick={() => deleteBanner(banner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Screenshots Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Screenshot Casino</h2>

            {/* Add New Screenshot */}
            <GlassCard className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tambah Screenshot Baru</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="URL Gambar Screenshot"
                    value={newScreenshot.image_url}
                    onChange={(e) => setNewScreenshot({ ...newScreenshot, image_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#00ff88] text-[#00ff88] bg-transparent"
                    onClick={() =>
                      setNewScreenshot({
                        ...newScreenshot,
                        image_url: generateImageUrl("screenshot", newScreenshot.category),
                      })
                    }
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Judul Screenshot"
                  value={newScreenshot.title}
                  onChange={(e) => setNewScreenshot({ ...newScreenshot, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Textarea
                  placeholder="Deskripsi (opsional)"
                  value={newScreenshot.description}
                  onChange={(e) => setNewScreenshot({ ...newScreenshot, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Select
                  value={newScreenshot.category}
                  onValueChange={(value) => setNewScreenshot({ ...newScreenshot, category: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lobby">Lobby</SelectItem>
                    <SelectItem value="games">Games</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="promotions">Promotions</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="screenshot-featured"
                    checked={newScreenshot.is_featured}
                    onChange={(e) => setNewScreenshot({ ...newScreenshot, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="screenshot-featured" className="text-white text-sm">
                    Screenshot Unggulan
                  </label>
                </div>
                <Button onClick={addScreenshot} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Screenshot
                </Button>
              </div>
            </GlassCard>

            {/* Existing Screenshots */}
            <div className="space-y-4">
              {screenshots.map((screenshot) => (
                <GlassCard key={screenshot.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-12 relative rounded overflow-hidden">
                      <Image
                        src={screenshot.image_url || "/placeholder.svg"}
                        alt={screenshot.title || "Screenshot"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{screenshot.title}</h4>
                      <p className="text-gray-400 text-sm capitalize">{screenshot.category}</p>
                      {screenshot.is_featured && (
                        <span className="inline-block bg-[#00ff88] text-black text-xs px-2 py-1 rounded mt-1">
                          Featured
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                      onClick={() => deleteScreenshot(screenshot.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
            <Link href={`/casinos/${casinoId}`} target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              Preview Halaman Casino
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
